export const siteConfig = {
  name: "John Curran",
  title: "Senior Platform & Software Engineer",
  description: "Portfolio website of John Curran",
  accentColor: "#8fd3a9",
  social: {
    email: "curran736@gmail.com",
    linkedin: "https://www.linkedin.com/in/john-curran-77957b39",
    github: "https://github.com/john5223",
    cv: "/JohnCurranJr-Resume-2026.pdf",
    docx: "/JohnCurranJr-Resume-2026.docx"
  },
  aboutMe:
    "Senior platform and software engineer with 14+ years of experience building Kubernetes platforms, cloud infrastructure, CI/CD automation, and backend services. Hands-on with Python and Go across AWS, GCP, and Azure.",
  skills: [
    "Kubernetes", "AWS", "GCP", "Azure", "Docker", "Terraform",
    "Helm", "Argo CD", "Flux", "GitHub Actions", "Git", "Ansible", "Salt", "MAAS",
    "Python", "Go", "C/C++", "Java", "PHP", "JavaScript", "Node.js", "React",
    "PostgreSQL", "TimescaleDB", "Linux", "Grafana", "Datadog", "pfSense", "OpenVPN"
  ],
  projects: [
    {
      name: "Candlestick Pattern Analysis & Trading Reports",
      includeInResume: true,
      description:
        "Built a Flask API and reporting app that detects candlestick patterns, scores historical outcomes, and provides symbol- and industry-level statistics. Celery workers collect market data and run parallel analyses; HTML reports combine pattern-hit charts with news and analyst ratings. Added BUY/SELL candidate review with per-symbol charts and generated order text for MetaTrader 4/5 and thinkorswim.",
      link: "/patterns",
      skills: ["Python", "Go", "SQL", "Flask", "Celery", "Redis", "PostgreSQL", "TimescaleDB", "Pandas", "NumPy", "TastyTrade", "Airflow"],
    },
    {
      name: "TimescaleDB vs Postgres Benchmark",
      description: "Reduced a tested time-series workload from 400 seconds to 11 seconds using TimescaleDB partitioning.",
      link: "https://github.com/john5223/timescale_benchmark?tab=readme-ov-file#results",
      skills: ["Python", "Celery", "TimescaleDB", "Postgres"]
    },
    {
      name: "Minas",
      description: "ThinkScript studies for the thinkorswim technical analysis platform.",
      link: "https://github.com/john5223/minas",
      skills: ["ThinkorSwim"]

    }
  ],
  experience: [
    {
      company: "LEXSO",
      url: "https://github.com/LEXSO-Dev",
      title: "Platform Software Engineer",
      dateRange: "April 2026 - November 2026",
      bullets: [
        "Implemented cross-service Keycloak/JWT authentication and Administrator/Operator authorization, including JWKS caching, replay protection, audit logging, trusted account linking, and admin-only provisioning.",
        "Built a user-data service for per-user instance and site associations, integrated Gateway profile operations, and added production deployment workflows.",
        "Delivered React admin workflows and Gateway/Registry API integrations for validated device and settings imports/exports, including metadata-rich instance ZIP exports.",
        "Expanded Registry with device-class discovery, capability filtering, validation; implemented ONVIF PTZ status ingestion with dedicated collector and worker support.",
        "Expanded Python service tests and GitHub Actions CI to build Docker images, run authentication/API tests, and publish coverage summaries and artifacts.",
      ],
    },
    {
      company: "Red Knight",
      url: "https://red-knight.com/",
      title: "Senior Systems / Software",
      dateRange: "August 2023 - December 2025",
      hardware: ["PowerEdge R6515", "Dell Powerswitch"],
      infra: ["Kubernetes"],
      configuration: ["Helm Charts", "Zarf Packages"],
      languages: ["Python", "Go"],
      bullets: [
        "Deployed RKE2 clusters for a lab of over 50 servers, and deployed services with Helm, Flux, and Argo CD; built GitLab/GitHub pipelines and <a target=_blank href='https://zarf.dev/'>Zarf</a> packages for offline IDS deployments.",
        "Supported DCO Core on <a target=_blank href='https://github.com/DoD-Platform-One/bigbang'>BigBang</a>; packaged Zeek, Suricata, Arkime, and Elasticsearch for disconnected environments.",
        "Automated bare-metal provisioning with MAAS, PXE, and Packer images; integrated Dell OS10 switch configuration into Django/Celery deployment tools.",
        "Deployed Airflow and contributed workflows for machine-learning applications detecting network-traffic anomalies.",
        "Troubleshot infrastructure and application issues across hardware, Helm charts, and Python/Go services, including a spanning-tree setup failure."
      ],
    },
    {
      company: "JumpCloud",
      url: "https://jumpcloud.com/",
      title: "Senior Software / Data Engineer",
      dateRange: "January 2022 - July 2023",
      pageBreakBefore: true,
      bullets: [
        "Migrated monolithic EC2 deployments to microservices on Nomad and Kubernetes and managed GitHub CI/CD pipelines.",
        "Managed System Insights APIs and osquery event pipelines into PostgreSQL, Kafka, and Snowflake.",
        "Diagnosed Python/Go production issues using Datadog and deployment logs; participated in on-call response for service incidents."
      ],
    },
    {
      company: "BrainGu",
      url: "https://www.braingu.com/",
      title: "DevSecOps Platform Engineer - Air Force Contractor",
      dateRange: "December 2020 - December 2021",
      bullets: [
        "Supported the Air Force LevelUp program by deploying RKE2 Kubernetes platforms aligned with the DoD DevSecOps Reference Architecture using <a target=_blank href='https://github.com/DoD-Platform-One/bigbang'>BigBang</a>, Flux, and Argo CD.",
        "Managed AWS infrastructure with Terraform and GitOps, integrated CSI drivers, and partnered with application teams to deploy across staging, test, and production clusters."
      ],
    },
    {
      company: "ManTech",
      url: "https://www.mantech.com/",
      title: "Senior DevOps Architect",
      dateRange: "October 2018 - December 2020",
      bullets: [
        "Supported the Air Force Research Laboratory CVAH program; built 10 deployable interceptor kits with 7–10 servers each for load testing and deployed Zeek, Suricata, and Arkime in Kubernetes/CRI-O.",
        "Automated Redfish hardware discovery, PXE boot, and power control in CI; configured Cisco/Dell switches, out-of-band and Ixia packet-broker routing, pfSense, and per-kit DNS.",
        "Configured OpenVPN/IPsec access for remote sensors; maintained Jenkins and Ansible build automation and tested IDS detection with Verodin/BreakingPoint.",
        "Built a 10 Gb/s traffic-generation solution and measured 6 Gb/s packet-capture throughput with tcpdump; generated up to 10 Gb/s with DPDK Pktgen, MoonGen, and BreakingPoint.",
        "<a target=_blank href='/Emmerich.pdf'>Reference: Mind the Gap – A Comparison of Software Packet Generators.</a>"
      ],
    },
    {
      company: "Planet Labs",
      url: "https://www.planet.com/",
      title: "Senior Software Engineer",
      dateRange: "June 2017 - October 2018",
      bullets: [
        "Deployed an OpenID Connect service for Salesforce SSO and migrated Ansible deployments to Docker on Kubernetes.",
        "Migrated PostgreSQL databases and services from AWS to GCP and supported private Azure deployments.",
        "Used Kibana traffic reports to debug the public API; improved reliability by optimizing large GeoJSON searches and fixing queries across the antimeridian."
      ],
    },
    {
      company: "Showroom Logic",
      title: "Senior Software Engineer",
      dateRange: "October 2013 - May 2017",
      bullets: [
        "Built distributed ETL and scheduled tasks to aggregate Google Ads, Google Analytics, and other data into executive reports; integrated workflows with Amazon SWF.",
        "Led Flask/Django development and built SQL reporting interfaces with Morris.js and D3.js visualizations.",
        "Developed a distributed hosting platform for thousands of dealer websites, improving conversion through stronger quality scores; added Varnish caching, A/B testing, and SOAP/REST payment integrations.",
        "Built a campaign management platform that shifted ad spend toward top-performing campaigns using a proprietary ranking algorithm."
      ],
    },
    {
      company: "Rackspace",
      url: "https://www.rackspace.com/",
      title: "DevOps Engineer II / Quality Engineering",
      dateRange: "August 2012 - October 2013",
      bullets: [
        "Helped establish the Private Cloud Quality Engineering team and built a Razor provisioning API to PXE boot bare-metal CentOS, Fedora, and Ubuntu systems.",
        "Automated Chef/OpenStack tests through APIs, Jenkins, and Git hooks, covering database/LDAP authentication and Cinder backends including LVM and EMC.",
        "Built a Python application to visualize lab infrastructure and interact with OpenStack deployments."
      ],
    },
  ],
  education: [
    {
      school: "Texas State University",
      degree: "Bachelor of Science in Computer Science",
      dateRange: "May 2011",
      achievements: [
        "Minor in Mathematics; received the Texas State Undergraduate Research Excellence Award (2010) and National Hispanic Scholarship (2007).",
        "Paid research assistant to Dr. Chen; co-authored <a target=_blank href='https://www.researchgate.net/publication/289643867_A_minimization_problem_in_wireless_sensor_networks'>A Minimization Problem in Wireless Sensor Networks</a>, published at the International Conference on Parallel and Distributed Computing and Networks (2010)."
      ],
    },
  ],
};
