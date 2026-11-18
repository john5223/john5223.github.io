#!/usr/bin/env python3
"""Rebuild resume sections in an existing DOCX while retaining its Word layout."""

from __future__ import annotations

import html
import os
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path
from xml.dom import Node, minidom

WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
XML_NS = "http://www.w3.org/XML/1998/namespace"

BR_OR_LINK_RE = re.compile(r"<br\s*/?>|<a\b([^>]*)>(.*?)</a>", re.IGNORECASE | re.DOTALL)
BOLD_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.IGNORECASE | re.DOTALL)
HREF_RE = re.compile(r"\bhref\s*=\s*(['\"])(.*?)\1", re.IGNORECASE | re.DOTALL)


def local_name(node: Node) -> str:
    return node.localName or node.nodeName.split(":")[-1]


def child_elements(node: Node) -> list[Node]:
    return [child for child in node.childNodes if child.nodeType == Node.ELEMENT_NODE]


def child(node: Node, namespace: str, name: str) -> Node | None:
    return next(
        (item for item in child_elements(node) if item.namespaceURI == namespace and local_name(item) == name),
        None,
    )


def children_named(node: Node, namespace: str, name: str) -> list[Node]:
    return [item for item in child_elements(node) if item.namespaceURI == namespace and local_name(item) == name]


def descendants_named(node: Node, namespace: str, name: str) -> list[Node]:
    return [
        item
        for item in node.getElementsByTagNameNS(namespace, name)
    ]


def paragraph_text(paragraph: Node) -> str:
    return "".join(text_node.firstChild.data if text_node.firstChild else "" for text_node in descendants_named(paragraph, WORD_NS, "t"))


def run_list(paragraph: Node) -> list[Node]:
    return children_named(paragraph, WORD_NS, "r")


def run_text(run: Node) -> str:
    return "".join(text_node.firstChild.data if text_node.firstChild else "" for text_node in descendants_named(run, WORD_NS, "t"))


def run_properties(run: Node | None) -> Node | None:
    return child(run, WORD_NS, "rPr") if run is not None else None


def set_word_attribute(node: Node, name: str, value: str) -> None:
    node.setAttributeNS(WORD_NS, f"w:{name}", value)


def force_bold_properties(properties: Node | None, document: minidom.Document) -> Node:
    result = properties.cloneNode(deep=True) if properties is not None else document.createElementNS(WORD_NS, "w:rPr")
    for name in ("b", "bCs"):
        property_node = child(result, WORD_NS, name)
        if property_node is None:
            property_node = document.createElementNS(WORD_NS, f"w:{name}")
            result.appendChild(property_node)
        set_word_attribute(property_node, "val", "1")
    return result


def bold_run(run: Node) -> bool:
    properties = run_properties(run)
    bold = child(properties, WORD_NS, "b") if properties is not None else None
    return bold is not None and bold.getAttributeNS(WORD_NS, "val") != "0"


def clean_text(value: str) -> str:
    value = re.sub(r"<br\s*/?\s*>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<a\b[^>]*>(.*?)</a>", r"\1", value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def paragraph_properties(paragraph: Node, document: minidom.Document) -> Node:
    properties = child(paragraph, WORD_NS, "pPr")
    if properties is None:
        properties = document.createElementNS(WORD_NS, "w:pPr")
        paragraph.insertBefore(properties, paragraph.firstChild)
    return properties


def new_paragraph(template: Node, document: minidom.Document) -> Node:
    paragraph = document.createElementNS(WORD_NS, "w:p")
    properties = child(template, WORD_NS, "pPr")
    if properties is not None:
        paragraph.appendChild(properties.cloneNode(deep=True))
    return paragraph


def add_spacing_before(paragraph: Node, twips: int, document: minidom.Document) -> None:
    properties = paragraph_properties(paragraph, document)
    spacing = child(properties, WORD_NS, "spacing")
    if spacing is None:
        spacing = document.createElementNS(WORD_NS, "w:spacing")
        properties.appendChild(spacing)
    if spacing.hasAttributeNS(WORD_NS, "after"):
        spacing.removeAttributeNS(WORD_NS, "after")
    set_word_attribute(spacing, "before", str(twips))


def add_spacing_after(paragraph: Node, twips: int, document: minidom.Document) -> None:
    properties = paragraph_properties(paragraph, document)
    spacing = child(properties, WORD_NS, "spacing")
    if spacing is None:
        spacing = document.createElementNS(WORD_NS, "w:spacing")
        properties.appendChild(spacing)
    set_word_attribute(spacing, "after", str(twips))


def add_page_break_before(paragraph: Node, document: minidom.Document) -> None:
    properties = paragraph_properties(paragraph, document)
    page_break = child(properties, WORD_NS, "pageBreakBefore")
    if page_break is None:
        page_break = document.createElementNS(WORD_NS, "w:pageBreakBefore")
        properties.appendChild(page_break)
    set_word_attribute(page_break, "val", "1")


def add_run(paragraph: Node, text: str, properties: Node | None, document: minidom.Document) -> None:
    run = document.createElementNS(WORD_NS, "w:r")
    if properties is not None:
        run.appendChild(properties.cloneNode(deep=True))
    paragraph.appendChild(run)
    for index, part in enumerate(text.split("\t")):
        if index:
            run.appendChild(document.createElementNS(WORD_NS, "w:tab"))
        if not part:
            continue
        text_element = document.createElementNS(WORD_NS, "w:t")
        if part.startswith(" ") or part.endswith(" "):
            text_element.setAttributeNS(XML_NS, "xml:space", "preserve")
        text_element.appendChild(document.createTextNode(part))
        run.appendChild(text_element)


def paragraph_with_text(template: Node, text: str, properties: Node | None, document: minidom.Document) -> Node:
    paragraph = new_paragraph(template, document)
    add_run(paragraph, text, properties, document)
    return paragraph


def format_summary_lead(paragraph: Node, document: minidom.Document) -> None:
    text = paragraph_text(paragraph)
    match = re.match(r"\A(.+?)\s+with\b", text, flags=re.IGNORECASE)
    if not match:
        raise ValueError("Could not identify the role lead-in in the resume summary")

    lead = match.group(1)
    remainder = text[len(lead) :]
    original_runs = run_list(paragraph)
    original_properties = run_properties(original_runs[0]) if original_runs else None
    normal_properties = original_properties.cloneNode(deep=True) if original_properties is not None else document.createElementNS(WORD_NS, "w:rPr")
    bold_properties = force_bold_properties(normal_properties, document)
    for properties in (normal_properties, bold_properties):
        fonts = child(properties, WORD_NS, "rFonts")
        if fonts is None:
            fonts = document.createElementNS(WORD_NS, "w:rFonts")
            properties.appendChild(fonts)
        for attribute in ("ascii", "cs", "eastAsia", "hAnsi"):
            set_word_attribute(fonts, attribute, "Arial")

    for run in original_runs:
        paragraph.removeChild(run)
    add_run(paragraph, lead, bold_properties, document)
    add_run(paragraph, remainder, normal_properties, document)


def set_section_heading_size(styles: minidom.Document, half_points: int) -> None:
    heading_style = next(
        (style for style in descendants_named(styles, WORD_NS, "style") if style.getAttributeNS(WORD_NS, "styleId") == "Heading1"),
        None,
    )
    if heading_style is None:
        raise ValueError("Heading 1 style not found in DOCX template")

    properties = child(heading_style, WORD_NS, "rPr")
    if properties is None:
        properties = styles.createElementNS(WORD_NS, "w:rPr")
        heading_style.appendChild(properties)
    for name in ("sz", "szCs"):
        size = child(properties, WORD_NS, name)
        if size is None:
            size = styles.createElementNS(WORD_NS, f"w:{name}")
            properties.appendChild(size)
        set_word_attribute(size, "val", str(half_points))


def paragraph_with_bullet(
    template: Node,
    value: str,
    normal_properties: Node | None,
    bold_properties: Node | None,
    document: minidom.Document,
) -> Node:
    paragraph = new_paragraph(template, document)
    bold_match = BOLD_RE.search(value)
    cleaned = clean_text(value)
    if bold_match:
        label = clean_text(bold_match.group(1))
        remainder = cleaned.replace(label, "", 1)
        add_run(paragraph, label, bold_properties, document)
        add_run(paragraph, remainder, normal_properties, document)
    else:
        add_run(paragraph, cleaned, normal_properties, document)
    return paragraph


def add_external_hyperlink(
    paragraph: Node,
    relationships: minidom.Document,
    href: str,
    label: str,
    document: minidom.Document,
) -> None:
    identifiers = [
        relation.getAttribute("Id")
        for relation in descendants_named(relationships, PACKAGE_REL_NS, "Relationship")
    ]
    numbers = [int(match.group(1)) for identifier in identifiers if (match := re.fullmatch(r"rId(\d+)", identifier))]
    relationship_id = f"rId{max(numbers, default=0) + 1}"

    relationship = relationships.createElementNS(PACKAGE_REL_NS, "Relationship")
    relationship.setAttribute("Id", relationship_id)
    relationship.setAttribute("Type", f"{REL_NS}/hyperlink")
    relationship.setAttribute("Target", html.unescape(href))
    relationship.setAttribute("TargetMode", "External")
    relationships.documentElement.appendChild(relationship)

    hyperlink = document.createElementNS(WORD_NS, "w:hyperlink")
    hyperlink.setAttributeNS(REL_NS, "r:id", relationship_id)
    run = document.createElementNS(WORD_NS, "w:r")
    run_properties_element = document.createElementNS(WORD_NS, "w:rPr")
    color = document.createElementNS(WORD_NS, "w:color")
    set_word_attribute(color, "val", "0563C1")
    underline = document.createElementNS(WORD_NS, "w:u")
    set_word_attribute(underline, "val", "single")
    run_properties_element.appendChild(color)
    run_properties_element.appendChild(underline)
    run.appendChild(run_properties_element)
    text_element = document.createElementNS(WORD_NS, "w:t")
    text_element.appendChild(document.createTextNode(clean_text(label)))
    run.appendChild(text_element)
    hyperlink.appendChild(run)
    paragraph.appendChild(hyperlink)


def paragraph_with_achievement(
    template: Node,
    value: str,
    normal_properties: Node | None,
    relationships: minidom.Document,
    document: minidom.Document,
) -> Node:
    paragraph = new_paragraph(template, document)
    cursor = 0
    for match in BR_OR_LINK_RE.finditer(value):
        raw_prefix = value[cursor : match.start()]
        prefix = clean_text(raw_prefix)
        if prefix:
            if raw_prefix and raw_prefix[-1].isspace():
                prefix += " "
            add_run(paragraph, prefix, normal_properties, document)

        if match.group(0).lower().startswith("<br"):
            run = document.createElementNS(WORD_NS, "w:r")
            run.appendChild(document.createElementNS(WORD_NS, "w:br"))
            paragraph.appendChild(run)
        else:
            href_match = HREF_RE.search(match.group(1) or "")
            if href_match is None:
                raise ValueError(f"Resume hyperlink is missing an href: {match.group(0)}")
            add_external_hyperlink(paragraph, relationships, href_match.group(2), match.group(2), document)
        cursor = match.end()

    suffix = clean_text(value[cursor:])
    if suffix:
        add_run(paragraph, suffix, normal_properties, document)
    return paragraph


def header_location(paragraph: Node) -> str | None:
    runs = run_list(paragraph)
    if len(runs) <= 1:
        return None

    run_children = child_elements(runs[1])
    tab_index = next(
        (index for index, element in enumerate(run_children) if element.namespaceURI == WORD_NS and local_name(element) == "tab"),
        None,
    )
    if tab_index is None:
        return None
    location = "".join(
        text_node.firstChild.data if text_node.firstChild else ""
        for element in run_children[:tab_index]
        if element.namespaceURI == WORD_NS and local_name(element) == "t"
        for text_node in [element]
    ).strip()
    return location or None


def has_child(node: Node, name: str) -> bool:
    return child(node, WORD_NS, name) is not None


def paragraph_properties_of(paragraph: Node) -> Node | None:
    return child(paragraph, WORD_NS, "pPr")


def insert_before(parent: Node, reference: Node, nodes: list[Node]) -> None:
    for node in nodes:
        parent.insertBefore(node, reference)


def validate_entries(experience: list, projects: list, education: list) -> None:
    for job in experience:
        if not all(isinstance(job.get(key), str) and job[key].strip() for key in ("company", "title", "dateRange")):
            raise ValueError(f"Experience entry is missing company/title/dateRange: {job!r}")
    for project in projects:
        if not all(isinstance(project.get(key), str) and project[key].strip() for key in ("name", "description")):
            raise ValueError(f"Project entry is missing name/description: {project!r}")
    for entry in education:
        if not all(isinstance(entry.get(key), str) and entry[key].strip() for key in ("school", "degree", "dateRange")):
            raise ValueError(f"Education entry is missing school/degree/dateRange: {entry!r}")
    if not experience or not projects or not education:
        raise ValueError("Experience, projects, and education must each contain at least one entry.")


def build_document(template_path: Path, output_path: Path, config: dict) -> None:
    experience = config["experience"]
    projects = config["projects"]
    education = config["education"]
    validate_entries(experience, projects, education)

    if template_path.resolve() == output_path.resolve():
        backup_path = Path(tempfile.gettempdir()) / f"{template_path.name}.before-generation"
        if not backup_path.exists():
            shutil.copy2(template_path, backup_path)

    with tempfile.TemporaryDirectory(prefix="resume-docx-") as temp_dir:
        unpacked = Path(temp_dir) / "template"
        unpacked.mkdir()
        with zipfile.ZipFile(template_path, "r") as archive:
            archive.extractall(unpacked)

        document_path = unpacked / "word" / "document.xml"
        relationships_path = unpacked / "word" / "_rels" / "document.xml.rels"
        styles_path = unpacked / "word" / "styles.xml"
        document = minidom.parse(str(document_path))
        relationships = minidom.parse(str(relationships_path))
        styles = minidom.parse(str(styles_path))
        set_section_heading_size(styles, 28)
        body = next(iter(descendants_named(document, WORD_NS, "body")), None)
        if body is None:
            raise ValueError("DOCX document body not found")

        body_children = child_elements(body)
        paragraph_by_text = {}
        for element in body_children:
            if local_name(element) != "p":
                continue
            text = paragraph_text(element)
            if text:
                paragraph_by_text.setdefault(text, element)

        summary_heading = paragraph_by_text.get("Summary of Qualifications")
        work_heading = paragraph_by_text.get("Work Experience")
        projects_heading = paragraph_by_text.get("Personal Project")
        education_heading = paragraph_by_text.get("Education")
        if not all((summary_heading, work_heading, projects_heading, education_heading)):
            raise ValueError("Expected Summary of Qualifications, Work Experience, Personal Project, and Education headings in template")

        summary_index = body_children.index(summary_heading)
        summary_paragraph = next(
            (element for element in body_children[summary_index + 1 :] if local_name(element) == "p" and paragraph_text(element)),
            None,
        )
        if summary_paragraph is None:
            raise ValueError("Resume summary paragraph not found in DOCX template")
        format_summary_lead(summary_paragraph, document)

        work_start = body_children.index(work_heading)
        projects_start = body_children.index(projects_heading)
        education_start = body_children.index(education_heading)
        if not work_start < projects_start < education_start:
            raise ValueError("Unexpected section ordering in DOCX template")

        old_work_elements = body_children[work_start + 1 : projects_start]
        old_project_elements = body_children[projects_start + 1 : education_start]
        old_education_elements = body_children[education_start + 1 :]
        old_work_paragraphs = [element for element in old_work_elements if local_name(element) == "p"]
        old_project_paragraphs = [element for element in old_project_elements if local_name(element) == "p"]
        old_education_paragraphs = [element for element in old_education_elements if local_name(element) == "p"]

        locations = {}
        for paragraph in old_work_paragraphs:
            runs = run_list(paragraph)
            if len(runs) <= 1:
                continue
            company = re.sub(r",\s*$", "", run_text(runs[0])).strip()
            location = header_location(paragraph)
            if location:
                locations[company] = location

        first_company = next(
            (
                paragraph
                for paragraph in old_work_paragraphs
                if (properties := paragraph_properties_of(paragraph)) is not None
                and not has_child(properties, "numPr")
                and has_child(properties, "tabs")
            ),
            None,
        )
        if first_company is None:
            raise ValueError("Company heading style not found in DOCX template")
        first_company_index = old_work_paragraphs.index(first_company)
        title_template = next(
            (
                paragraph
                for paragraph in old_work_paragraphs[first_company_index + 1 :]
                if (properties := paragraph_properties_of(paragraph)) is not None and not has_child(properties, "numPr")
            ),
            None,
        )
        if title_template is None:
            raise ValueError("Role title style not found in DOCX template")
        bullet_template = next(
            (
                paragraph
                for paragraph in old_work_paragraphs
                if (properties := paragraph_properties_of(paragraph)) is not None and has_child(properties, "numPr")
            ),
            None,
        )
        if bullet_template is None:
            raise ValueError("Experience bullet style not found in DOCX template")
        bold_bullet_template = next(
            (
                paragraph
                for paragraph in old_work_paragraphs
                if (properties := paragraph_properties_of(paragraph)) is not None
                and has_child(properties, "numPr")
                and len(run_list(paragraph)) > 1
                and bold_run(run_list(paragraph)[0])
            ),
            bullet_template,
        )

        project_heading_template = next(
            (
                paragraph
                for paragraph in old_project_paragraphs
                if (properties := paragraph_properties_of(paragraph)) is not None
                and not has_child(properties, "numPr")
                and (
                    any(
                        local_name(prop) == "rPr" and child(prop, WORD_NS, "b") is not None
                        for prop in child_elements(properties)
                    )
                    or any(bold_run(run) for run in run_list(paragraph))
                )
            ),
            None,
        )
        project_bullet_template = next(
            (
                paragraph
                for paragraph in old_project_paragraphs
                if (properties := paragraph_properties_of(paragraph)) is not None and has_child(properties, "numPr")
            ),
            None,
        )
        education_degree_template = old_education_paragraphs[0] if old_education_paragraphs else None
        education_plain_template = old_education_paragraphs[1] if len(old_education_paragraphs) > 1 else education_degree_template
        if project_heading_template is None or project_bullet_template is None or education_degree_template is None:
            raise ValueError("Project or education paragraph styles not found in DOCX template")

        company_runs = run_list(first_company)
        normal_source = next((run for run in run_list(bullet_template) if run_properties(run) is not None), None)
        normal_properties = run_properties(normal_source) if normal_source is not None else None
        bold_source = next(
            (run for run in run_list(bold_bullet_template) if run_properties(run) is not None and bold_run(run)),
            None,
        )
        bold_properties = run_properties(bold_source) if bold_source is not None else normal_properties
        company_bold_properties = force_bold_properties(run_properties(company_runs[0]) if company_runs else None, document)
        company_normal_properties = run_properties(company_runs[1]) if len(company_runs) > 1 else normal_properties
        title_run = run_list(title_template)[0] if run_list(title_template) else None
        title_properties = force_bold_properties(run_properties(title_run), document)
        project_title_properties = next((run_properties(run) for run in run_list(project_heading_template) if bold_run(run)), None)
        education_runs = run_list(education_degree_template)
        education_bold_properties = next((run_properties(run) for run in education_runs if bold_run(run)), None) or company_bold_properties
        education_normal_properties = next((run_properties(run) for run in education_runs if not bold_run(run)), None) or normal_properties
        plain_run = run_list(education_plain_template)[0] if education_plain_template and run_list(education_plain_template) else None
        education_plain_properties = run_properties(plain_run) if plain_run is not None else normal_properties

        new_work = []
        for job in experience:
            heading = new_paragraph(first_company, document)
            if job.get("pageBreakBefore"):
                add_page_break_before(heading, document)
            add_run(heading, job["company"], company_bold_properties, document)
            if locations.get(job["company"]):
                add_run(heading, f" {locations[job['company']]}", company_normal_properties, document)
            add_run(heading, f"\t{job['dateRange']}", company_normal_properties, document)
            new_work.extend((heading, paragraph_with_text(title_template, job["title"], title_properties, document)))

            job_bullets = job.get("bullets") or []
            for bullet_index, bullet in enumerate(job_bullets):
                paragraph = paragraph_with_bullet(bullet_template, bullet, normal_properties, bold_properties, document)
                if bullet_index == len(job_bullets) - 1:
                    spacing = child(paragraph_properties(paragraph, document), WORD_NS, "spacing")
                    if spacing is None:
                        spacing = document.createElementNS(WORD_NS, "w:spacing")
                        paragraph_properties(paragraph, document).appendChild(spacing)
                    set_word_attribute(spacing, "after", "240")
                new_work.append(paragraph)

        new_projects = []
        for project in projects:
            new_projects.append(paragraph_with_text(project_heading_template, project["name"], project_title_properties, document))
            skills = project.get("skills") or []
            if skills:
                new_projects.append(
                    paragraph_with_bullet(
                        bold_bullet_template,
                        f"<b>Technologies:</b> {', '.join(skills)}",
                        normal_properties,
                        bold_properties,
                        document,
                    )
                )
            new_projects.append(
                paragraph_with_bullet(project_bullet_template, project["description"], normal_properties, bold_properties, document)
            )

        new_education = []
        for entry in education:
            degree = new_paragraph(education_degree_template, document)
            add_run(degree, entry["degree"], education_bold_properties, document)
            add_run(degree, f", {entry['school']}", education_normal_properties, document)
            add_run(degree, f"\t{entry['dateRange']}", education_normal_properties, document)
            new_education.append(degree)
            for achievement in entry.get("achievements") or []:
                new_education.append(
                    paragraph_with_achievement(
                        education_plain_template,
                        achievement,
                        education_plain_properties,
                        relationships,
                        document,
                    )
                )

        for heading in (summary_heading, work_heading, projects_heading, education_heading):
            add_spacing_before(heading, 240, document)
            add_spacing_after(heading, 240, document)

        project_heading_properties = paragraph_properties(projects_heading, document)
        if child(project_heading_properties, WORD_NS, "pageBreakBefore") is None:
            add_page_break_before(projects_heading, document)

        for element in old_work_elements:
            body.removeChild(element)
        insert_before(body, projects_heading, new_work)

        current_children = child_elements(body)
        projects_index = current_children.index(projects_heading)
        education_index = current_children.index(education_heading)
        for element in current_children[projects_index + 1 : education_index]:
            body.removeChild(element)
        insert_before(body, education_heading, new_projects)

        current_children = child_elements(body)
        education_index = current_children.index(education_heading)
        section_properties = next((element for element in current_children if local_name(element) == "sectPr"), None)
        section_index = current_children.index(section_properties) if section_properties is not None else len(current_children)
        for element in current_children[education_index + 1 : section_index]:
            body.removeChild(element)
        if section_properties is not None:
            insert_before(body, section_properties, new_education)
        else:
            for element in new_education:
                body.appendChild(element)

        document_path.write_bytes(document.toxml(encoding="UTF-8"))
        relationships_path.write_bytes(relationships.toxml(encoding="UTF-8"))
        styles_path.write_bytes(styles.toxml(encoding="UTF-8"))

        output_path.parent.mkdir(parents=True, exist_ok=True)
        staged_output = output_path.with_name(f"{output_path.name}.tmp-{os.getpid()}")
        try:
            with zipfile.ZipFile(template_path, "r") as source_archive, zipfile.ZipFile(staged_output, "w") as output_archive:
                for item in source_archive.infolist():
                    part_path = unpacked / item.filename
                    data = part_path.read_bytes() if part_path.is_file() else source_archive.read(item.filename)
                    output_archive.writestr(item, data)
            with zipfile.ZipFile(staged_output, "r") as output_archive:
                bad_file = output_archive.testzip()
                if bad_file:
                    raise ValueError(f"Generated DOCX archive is invalid: {bad_file}")
            staged_output.replace(output_path)
        finally:
            if staged_output.exists():
                staged_output.unlink()

    print(f"Wrote {output_path}")


def main() -> None:
    if len(sys.argv) != 3:
        raise ValueError("Usage: generate-resume-docx.py TEMPLATE.docx OUTPUT.docx")
    config = __import__("json").load(sys.stdin)
    build_document(Path(sys.argv[1]), Path(sys.argv[2]), config)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"{type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
