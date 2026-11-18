#!/usr/bin/env ruby
# Rebuild resume sections in an existing DOCX while retaining its Word layout.

require 'cgi'
require 'fileutils'
require 'json'
require 'rexml/document'
require 'rexml/xpath'
require 'tmpdir'

abort 'Usage: generate-resume-docx.rb TEMPLATE.docx OUTPUT.docx' unless ARGV.length == 2
source, output = ARGV
config = JSON.parse(STDIN.read)

experience = config.fetch('experience')
projects = config.fetch('projects')
education = config.fetch('education')

def paragraph_text(paragraph)
  REXML::XPath.match(paragraph, './/*[local-name()="t"]').map(&:text).join
end

def run_list(paragraph)
  paragraph.elements.to_a.select { |element| element.name == 'r' }
end

def run_text(run)
  REXML::XPath.match(run, './/*[local-name()="t"]').map(&:text).join
end

def run_properties(run)
  run&.elements&.to_a&.find { |element| element.name == 'rPr' }
end

def force_bold_properties(properties)
  result = properties&.deep_clone || REXML::Element.new('w:rPr')
  %w[b bCs].each do |name|
    property = result.elements.to_a.find { |element| element.name == name }
    if property
      property.attributes['w:val'] = '1'
    else
      result.add_element("w:#{name}")
    end
  end
  result
end

def bold_run?(run)
  properties = run_properties(run)
  properties && properties.elements.to_a.any? do |element|
    element.name == 'b' && element.attributes['val'] != '0'
  end
end

def clean_text(value)
  CGI.unescapeHTML(value.to_s
    .gsub(/<br\s*\/?\s*>/i, ' ')
    .gsub(/<a\b[^>]*>(.*?)<\/a>/im, '\\1')
    .gsub(/<[^>]+>/, ''))
    .gsub(/\s+/, ' ')
    .strip
end

def new_paragraph(template)
  paragraph = REXML::Element.new('w:p')
  properties = template.elements.to_a.find { |element| element.name == 'pPr' }
  paragraph.add_element(properties.deep_clone) if properties
  paragraph
end

def add_paragraph_spacing_before(paragraph, twips)
  properties = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
  properties ||= paragraph.add_element('w:pPr')
  spacing = properties.elements.to_a.find { |element| element.name == 'spacing' }
  spacing ||= properties.add_element('w:spacing')
  spacing.attributes.delete('w:after')
  spacing.attributes['w:before'] = twips.to_s
end

def add_paragraph_spacing_after(paragraph, twips)
  properties = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
  properties ||= paragraph.add_element('w:pPr')
  spacing = properties.elements.to_a.find { |element| element.name == 'spacing' }
  spacing ||= properties.add_element('w:spacing')
  spacing.attributes['w:after'] = twips.to_s
end

def add_page_break_before(paragraph)
  properties = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
  properties ||= paragraph.add_element('w:pPr')
  page_break = properties.elements.to_a.find { |element| element.name == 'pageBreakBefore' }
  page_break ||= properties.add_element('w:pageBreakBefore')
  page_break.attributes['w:val'] = '1'
end

def add_run(paragraph, text, properties = nil)
  run = paragraph.add_element('w:r')
  run.add_element(properties.deep_clone) if properties
  text.split("\t", -1).each_with_index do |part, index|
    run.add_element('w:tab') if index.positive?
    next if part.empty?

    text_element = run.add_element('w:t')
    text_element.add_attribute('xml:space', 'preserve') if part.start_with?(' ') || part.end_with?(' ')
    text_element.text = part
  end
end

def paragraph_with_text(template, text, properties)
  paragraph = new_paragraph(template)
  add_run(paragraph, text, properties)
  paragraph
end

def format_summary_lead(paragraph)
  text = paragraph_text(paragraph)
  match = text.match(/\A(.+?)\s+with\b/i)
  abort 'Could not identify the role lead-in in the resume summary' unless match

  lead = match[1]
  remainder = text[lead.length..]
  original_run = run_list(paragraph).first
  normal_properties = run_properties(original_run)&.deep_clone || REXML::Element.new('w:rPr')
  bold_properties = force_bold_properties(normal_properties)
  [normal_properties, bold_properties].each do |properties|
    fonts = properties.elements.to_a.find { |element| element.name == 'rFonts' }
    fonts ||= properties.add_element('w:rFonts')
    %w[ascii cs eastAsia hAnsi].each { |attribute| fonts.attributes["w:#{attribute}"] = 'Arial' }
  end

  run_list(paragraph).each { |run| paragraph.delete_element(run) }
  add_run(paragraph, lead, bold_properties)
  add_run(paragraph, remainder, normal_properties)
end

def paragraph_with_bullet(template, value, normal_properties, bold_properties)
  paragraph = new_paragraph(template)
  markup = value.to_s
  cleaned = clean_text(markup)
  if markup =~ /<b[^>]*>(.*?)<\/b>/im
    label = clean_text(Regexp.last_match(1))
    remainder = cleaned.sub(label, '')
    add_run(paragraph, label, bold_properties)
    add_run(paragraph, remainder, normal_properties)
  else
    add_run(paragraph, cleaned, normal_properties)
  end
  paragraph
end

def add_external_hyperlink(paragraph, relationships, href, label, normal_properties)
  ids = REXML::XPath.match(relationships, '//*[local-name()="Relationship"]/@Id').map(&:value)
  next_id = ids.map { |id| id.match(/\ArId(\d+)\z/)&.captures&.first&.to_i }.compact.max.to_i + 1
  relationship_id = "rId#{next_id}"
  relationship = relationships.root.add_element('Relationship')
  relationship.add_attribute('Id', relationship_id)
  relationship.add_attribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink')
  relationship.add_attribute('Target', CGI.unescapeHTML(href))
  relationship.add_attribute('TargetMode', 'External')

  hyperlink = paragraph.add_element('w:hyperlink')
  hyperlink.add_attribute('r:id', relationship_id)
  run = hyperlink.add_element('w:r')
  run_properties = REXML::Element.new('w:rPr')
  color = run_properties.add_element('w:color')
  color.add_attribute('w:val', '0563C1')
  underline = run_properties.add_element('w:u')
  underline.add_attribute('w:val', 'single')
  run.add_element(run_properties)
  text = run.add_element('w:t')
  text.text = clean_text(label)
end

def paragraph_with_achievement(template, value, normal_properties, relationships)
  paragraph = new_paragraph(template)
  text = value.to_s
  cursor = 0
  text.to_enum(:scan, /<br\s*\/?>|<a\b([^>]*)>(.*?)<\/a>/im).each do
    match = Regexp.last_match
    raw_prefix = text[cursor...match.begin(0)]
    prefix = clean_text(raw_prefix)
    prefix += ' ' if !prefix.empty? && raw_prefix.match?(/\s\z/)
    add_run(paragraph, prefix, normal_properties) unless prefix.empty?

    if match[0].match?(/\A<br\b/i)
      paragraph.add_element('w:r').add_element('w:br')
    else
      href_match = match[1].match(/\bhref\s*=\s*(['"])(.*?)\1/im)
      abort "Resume hyperlink is missing an href: #{match[0]}" unless href_match
      add_external_hyperlink(paragraph, relationships, href_match[2], match[2], normal_properties)
    end
    cursor = match.end(0)
  end
  suffix = clean_text(text[cursor..])
  add_run(paragraph, suffix, normal_properties) unless suffix.empty?
  paragraph
end

def header_location(paragraph)
  runs = run_list(paragraph)
  return nil unless runs.length > 1

  children = runs[1].elements.to_a
  tab_index = children.index { |element| element.name == 'tab' }
  return nil unless tab_index

  location_text = children[0...tab_index]
    .select { |element| element.name == 't' }
    .map(&:text)
    .join
    .strip
  location_text.empty? ? nil : location_text
end

Dir.mktmpdir('resume-docx') do |directory|
  unpacked = File.join(directory, 'template')
  FileUtils.mkdir_p(unpacked)
  abort 'Could not extract DOCX template' unless system('unzip', '-q', source, '-d', unpacked)

  document_path = File.join(unpacked, 'word/document.xml')
  document = REXML::Document.new(File.read(document_path))
  relationships_path = File.join(unpacked, 'word/_rels/document.xml.rels')
  relationships = REXML::Document.new(File.read(relationships_path))
  body = REXML::XPath.first(document, '//*[local-name()="body"]')
  abort 'DOCX document body not found' unless body

  children = body.elements.to_a
  paragraph_by_text = {}
  children.each do |element|
    next unless element.name == 'p'

    text = paragraph_text(element)
    paragraph_by_text[text] ||= element unless text.empty?
  end

  work_heading = paragraph_by_text['Work Experience']
  summary_heading = paragraph_by_text['Summary of Qualifications']
  projects_heading = paragraph_by_text['Personal Project']
  education_heading = paragraph_by_text['Education']
  abort 'Expected Summary of Qualifications, Work Experience, Personal Project, and Education headings in template' unless summary_heading && work_heading && projects_heading && education_heading

  summary_index = children.index(summary_heading)
  summary_paragraph = children[(summary_index + 1)..].find do |element|
    element.name == 'p' && !paragraph_text(element).empty?
  end
  abort 'Resume summary paragraph not found in DOCX template' unless summary_paragraph
  format_summary_lead(summary_paragraph)

  work_start = children.index(work_heading)
  projects_start = children.index(projects_heading)
  education_start = children.index(education_heading)
  abort 'Unexpected section ordering in DOCX template' unless work_start < projects_start && projects_start < education_start

  old_work_paragraphs = children[(work_start + 1)...projects_start].select { |element| element.name == 'p' }
  old_project_paragraphs = children[(projects_start + 1)...education_start].select { |element| element.name == 'p' }
  old_education_paragraphs = children[(education_start + 1)..].to_a.select { |element| element.name == 'p' }

  # Keep existing location text where it is present; locations aren't stored in siteConfig.
  locations = {}
  old_work_paragraphs.each do |paragraph|
    runs = run_list(paragraph)
    next unless runs.length > 1

    company = run_text(runs.first).sub(/,\s*$/, '').strip
    location = header_location(paragraph)
    locations[company] = location if location
  end

  first_company = old_work_paragraphs.find do |paragraph|
    props = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
    props && !props.elements.to_a.any? { |element| element.name == 'numPr' } && props.elements.to_a.any? { |element| element.name == 'tabs' }
  end
  abort 'Company heading style not found in DOCX template' unless first_company
  first_company_index = old_work_paragraphs.index(first_company)
  title_template = old_work_paragraphs[(first_company_index + 1)..].find do |paragraph|
    props = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
    props && !props.elements.to_a.any? { |element| element.name == 'numPr' }
  end
  abort 'Role title style not found in DOCX template' unless title_template
  bullet_template = old_work_paragraphs.find do |paragraph|
    props = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
    props && props.elements.to_a.any? { |element| element.name == 'numPr' }
  end
  abort 'Experience bullet style not found in DOCX template' unless bullet_template
  bold_bullet_template = old_work_paragraphs.find do |paragraph|
    props = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
    props && props.elements.to_a.any? { |element| element.name == 'numPr' } && run_list(paragraph).length > 1 && bold_run?(run_list(paragraph).first)
  end
  bold_bullet_template ||= bullet_template

  project_heading_template = old_project_paragraphs.find do |paragraph|
    props = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
    paragraph_bold = props && props.elements.to_a.any? do |element|
      element.name == 'rPr' && element.elements.to_a.any? { |run_property| run_property.name == 'b' && run_property.attributes['val'] != '0' }
    end
    props && !props.elements.to_a.any? { |element| element.name == 'numPr' } && (paragraph_bold || run_list(paragraph).any? { |run| bold_run?(run) })
  end
  project_bullet_template = old_project_paragraphs.find do |paragraph|
    props = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
    props && props.elements.to_a.any? { |element| element.name == 'numPr' }
  end
  education_degree_template = old_education_paragraphs.first
  education_plain_template = old_education_paragraphs[1] || education_degree_template
  abort 'Project or education paragraph styles not found in DOCX template' unless project_heading_template && project_bullet_template && education_degree_template

  company_runs = run_list(first_company)
  normal_properties = run_properties(run_list(bullet_template).find { |run| run_properties(run) })
  bold_properties = run_properties(run_list(bold_bullet_template).find { |run| run_properties(run) && bold_run?(run) }) || normal_properties
  company_bold_properties = force_bold_properties(run_properties(company_runs.first))
  company_normal_properties = run_properties(company_runs[1]) || normal_properties
  title_properties = run_properties(run_list(title_template).first)
  title_properties = force_bold_properties(title_properties)
  project_title_properties = run_properties(run_list(project_heading_template).find { |run| bold_run?(run) })
  education_runs = run_list(education_degree_template)
  education_bold_properties = run_properties(education_runs.find { |run| bold_run?(run) }) || company_bold_properties
  education_normal_properties = run_properties(education_runs.find { |run| !bold_run?(run) }) || normal_properties
  education_plain_properties = run_properties(run_list(education_plain_template).first) || normal_properties

  new_work = []
  experience.each do |job|
    company = job.fetch('company')
    heading = new_paragraph(first_company)
    add_page_break_before(heading) if job['pageBreakBefore']
    add_run(heading, company, company_bold_properties)
    location = locations[company]
    add_run(heading, " #{location}", company_normal_properties) if location
    add_run(heading, "\t#{job.fetch('dateRange')}", company_normal_properties)
    new_work << heading
    new_work << paragraph_with_text(title_template, job.fetch('title'), title_properties)
    job_bullets = Array(job['bullets'])
    job_bullets.each_with_index do |bullet, bullet_index|
      paragraph = paragraph_with_bullet(bullet_template, bullet, normal_properties, bold_properties)
      if bullet_index == job_bullets.length - 1
        paragraph_properties = paragraph.elements.to_a.find { |element| element.name == 'pPr' }
        paragraph_properties ||= paragraph.add_element('w:pPr')
        spacing = paragraph_properties.elements.to_a.find { |element| element.name == 'spacing' }
        spacing ||= paragraph_properties.add_element('w:spacing')
        spacing.attributes['w:after'] = '240'
      end
      new_work << paragraph
    end
  end

  new_projects = []
  projects.each do |project|
    new_projects << paragraph_with_text(project_heading_template, project.fetch('name'), project_title_properties)
    skills = Array(project['skills'])
    unless skills.empty?
      new_projects << paragraph_with_bullet(bold_bullet_template, "<b>Technologies:</b> #{skills.join(', ')}", normal_properties, bold_properties)
    end
    new_projects << paragraph_with_bullet(project_bullet_template, project.fetch('description'), normal_properties, bold_properties)
  end

  new_education = []
  education.each do |entry|
    degree_text = [entry.fetch('degree'), entry.fetch('school')].join(', ')
    degree = new_paragraph(education_degree_template)
    add_run(degree, entry.fetch('degree'), education_bold_properties)
    add_run(degree, ", #{entry.fetch('school')}", education_normal_properties)
    add_run(degree, "\t#{entry.fetch('dateRange')}", education_normal_properties)
    new_education << degree
    Array(entry['achievements']).each do |achievement|
      new_education << paragraph_with_achievement(education_plain_template, achievement, education_plain_properties, relationships)
    end
  end

  experience.each do |job|
    abort "Experience entry is missing company/title/dateRange: #{job.inspect}" unless %w[company title dateRange].all? { |key| job[key].is_a?(String) && !job[key].strip.empty? }
  end
  projects.each do |project|
    abort "Project entry is missing name/description: #{project.inspect}" unless %w[name description].all? { |key| project[key].is_a?(String) && !project[key].strip.empty? }
  end
  education.each do |entry|
    abort "Education entry is missing school/degree/dateRange: #{entry.inspect}" unless %w[school degree dateRange].all? { |key| entry[key].is_a?(String) && !entry[key].strip.empty? }
  end
  if experience.empty? || projects.empty? || education.empty?
    abort 'Experience, projects, and education must each contain at least one entry.'
  end
  if File.expand_path(output) == File.expand_path(source)
    backup_path = File.join(Dir.tmpdir, "#{File.basename(source)}.before-generation")
    FileUtils.cp(source, backup_path) unless File.exist?(backup_path)
  end

  [summary_heading, work_heading, projects_heading, education_heading].each do |heading|
    add_paragraph_spacing_before(heading, 240)
    add_paragraph_spacing_after(heading, 240)
  end

  # Keep the projects and education section together on a fresh page, matching the original resume's layout.
  project_heading_properties = projects_heading.elements.to_a.find { |element| element.name == 'pPr' }
  abort 'Projects heading has no paragraph properties in template' unless project_heading_properties
  unless project_heading_properties.elements.to_a.any? { |element| element.name == 'pageBreakBefore' }
    project_heading_properties.add_element('w:pageBreakBefore').add_attribute('w:val', '1')
  end

  (children[(work_start + 1)...projects_start]).each { |element| body.delete_element(element) }
  new_work.each { |element| body.insert_before(projects_heading, element) }

  current_children = body.elements.to_a
  projects_index = current_children.index(projects_heading)
  education_index = current_children.index(education_heading)
  current_children[(projects_index + 1)...education_index].each { |element| body.delete_element(element) }
  new_projects.each { |element| body.insert_before(education_heading, element) }

  current_children = body.elements.to_a
  education_index = current_children.index(education_heading)
  section_properties = current_children.find { |element| element.name == 'sectPr' }
  section_index = current_children.index(section_properties) || current_children.length
  current_children[(education_index + 1)...section_index].each { |element| body.delete_element(element) }
  new_education.each { |element| section_properties ? body.insert_before(section_properties, element) : body.add_element(element) }

  File.write(document_path, document.to_s)
  File.write(relationships_path, relationships.to_s)
  FileUtils.mkdir_p(File.dirname(output))
  staged_output = "#{output}.tmp-#{Process.pid}"
  abort 'Could not create output DOCX' unless system('zip', '-q', '-r', staged_output, '.', chdir: unpacked)
  abort 'Generated DOCX archive is invalid' unless system('unzip', '-tq', staged_output, out: File::NULL)
  FileUtils.mv(staged_output, output)
ensure
  FileUtils.rm_f(staged_output) if defined?(staged_output) && staged_output
end

puts "Wrote #{output}"
