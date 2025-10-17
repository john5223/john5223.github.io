export const siteConfig = {
  name: "John Curran",
  title: "Senior DevOps / Software Engineer",
  description: "Portfolio website of John Curran",
  accentColor: "#135311ff",
  social: {
    email: "curran736@gmail.com",
    linkedin: "https://www.linkedin.com/in/john-curran-77957b39",
    github: "https://github.com/john5223",
    cv: "/JohnCurranJr-Resume-2025.pdf"
  },
  aboutMe:
    "I am an experienced dev ops and software engineer who has a passion for building efficient software and also has empathy and humor to make it through the day as a team.",
  skills: ["Linux", "Git", "Github Workflows (CI/CD)", "ArgoCD",
           "Ansible", "Salt",
          "Kubernetes", "AWS", "GCP", "Azure", "Docker",
          "Python", "Go", "C/C++", "Java", "PHP", 
          "Javascript", "React", "Node.js",
          "PostgreSQL", "TimescaleDB",
          "Hardware Setup", "PFSense", "OpenVPN"],
  projects: [
    {
      name: "Candle stick pattern analysis (coming soon)",
      description:
        "Analyze candle stick patterns in the stock market to look for reliable patterns to predict future market trends.",
      link: "/patterns",
      skills: ["Python", "Celery", "Pandas", "Numpy", "Redis", "TimescaleDB"],
    },
    {
      name: "TimescaleDB vs Postgres Benchmark",
      description: "Benchmark the performance improvements gained by using timescale db partitions with time series data. <br  /> \
                    Brought the workload tested from <b style='color:red'>400 seconds</b> to completion \
                    down to <b style='color:red'>11 seconds</b> to completion using partitioned timescaledb tables.",
      link: "https://github.com/john5223/timescale_benchmark?tab=readme-ov-file#results",
      skills: ["Python", "Celery", "TimescaleDB", "Postgres"]
    },
    {
      name: "Minas",
      description: "Collection of thinkscripts for use with thinkorswim technical analysis platform.",
      link: "https://github.com/john5223/minas",
      skills: ["ThinkorSwim"]

    }
  ],
  experience: [
    {
      company: "Red Knight",
      url: "https://red-knight.com/",
      title: "DevSecOps Engineer - Air Force Contractor",
      dateRange: "July 2023 - August 2025",
      hardware: ["PowerEdge R6515", "Dell Powerswitch"],
      infra: ["Kubernetes"],
      configuration: ["Helm Charts", "Zarf Packages"],
      languages: ["Python", "Go"],
      bullets: [
        "<b>Hardware:</b> PowerEdge R6515, Dell Powerswitch",
        "<b>Languages:</b> Python, Go",
        "<b>Configuration:</b> MAAS, Kubernetes manifests, helm charts, <a style='color: blue' href='https://zarf.dev/'>Zarf</a> packages",
        "Build out deployable kits consisting of 10 PowerEdge servers clustered together using Kubernetes.",
        "Install and test offline package installation (via zarf) of network intrusion detection software which includes tools such as zeek, suricata, arkime, elasticsearch, etc into a kubernetes deployment.",
        "Built zarf packages for deploying applications. Zarf packages are helm charts and docker images packaged together for use in offline deployments of applications within a kubernetes deployment (https://zarf.dev)",
        "Setup Canonical’s MAAS software for setup of infrastructure components including Dell switches, firewall and kit servers via DHCP and PXE boot configurations.",
        "Building packer “golden” images for use by MAAS to PXE boot the servers into a RKE2 Kubernetes cluster.",
        "Automate OS10 Dell Powerswitch builds to configure the network for a deployable kit with a custom script utilizing paramiko.",
        "Debug issues all the way from hardware misconfigurations to helm charts to fixing 3rd party application code by checking logs and fixing python or go code.",
        "Fixed the automation for handling spanning tree loop when setting up switch before PFSense firewall was configured."
      ],
    },
    {
      company: "Jumpcloud",
      url: "https://jumpcloud.com/",
      title: "Senior Software / Data Engineer",
      dateRange: "January 2022 - July 2023",
      bullets: [
        "<b>Languages:</b> Node.js, Python, Go​",
        "Migrating monolithic ec2 application deployments into smaller microservice nomad kubernetes deployments.",
        "Managed system insight api and events for tracking os query data into jumpcloud pipelines and databases (postgres, kafka and snowflake)",
        "Debug and fix backend issues with jumpcloud python and go deployments by monitoring datadog and deployment logs",
        "On call for monitoring and fixing error rates on production deployments."
      ],
    },
    {
      company: "BrainGu",
      url: "https://www.braingu.com/",
      title: "DevSecOps Platform Engineer - Air Force Contractor",
      dateRange: "December 2020 - December 2021",
      bullets: [
        "<b>Environment:</b> GovCloud AWS, Kubernetes",
        "Contractor supporting Air Forces LevelUp program to deploy Kuberneres according to DoD's DevSecOps Reference Architecture",
        "Use rke3 to deploy kubernetes, flux to deploy platform applications, and argocd to deploy customer applications.",
        "Manage AWS infrastructure via terraform and gitops.",
        "Work with application teams to deploy their workloads into staging, test and production clusters.",
        "Integrate CSI drivers and other platform applications into kubernetes deployments.",
        "Use SAFe Agile process to run sprint planning, retrospectives, and daily stand ups.",
      ],
    },
    {
      company: "ManTech",
      url: "https://www.mantech.com/",
      title: "DevOps Engineer (SME) - Air Force Contractor",
      dateRange: "October 2018 - December 2020",
      bullets: [
        "<b>Languages:</b> Python",
        "<b>Servers:</b> Supermicro x8 / x10, HP DL-160, Dell R440, Dell XR2, Tracewell T-FX2",
        "<b>Switches:</b> Cisco Catalyst, Dell S-Series",
        "<b>Packet Broker:</b> Ixia xStream 40, Vision Edge 40 (E40)",
        "<b>Database:</b> Elasticsearch 6 and 7.5",
        "<b>Tools:</b> Kubernetes, Ansible, Kibana, DPDK, Moongen, Breaking Point, Verodin, Redfish API, Zeek, Suricata, Moloch",
        "<b>References:</b> <a style='color:blue;font-weight:bold' href='/Emmerich.pdf'>(PDF) Mind the Gap – A Comparison of Software Packet Generators By Emmerich, etc.</a>",
        "Contractor for Air Force Research Laboratories (AFRL) supporting CVAH program.",
        "Built out a lab of 10 deployable interceptor kits (7-10 R440 servers) for load testing.",
        "Deployed network IDS suites (Bro/Zeek, Suricata, Moloch/Arkime) deployed via kubernetes into cri-o containers.",
        "Rack and stack servers and switches.",
        "Configured lab switches, OOB interfaces and Ixia Packet Broker network routing.",
        "Setup labs distribution and access switches to handle routes to firewall’s (pfsense) external interfaces.",
        "Setup custom domains for each kit and conditional DNS forwarding with dnsmasq",
        "Automated discovery of hardware via Redfish API. Integrated MAC address retrieval, setting boot order for one time PXE boot, and power control into the system for Continuous Integration pipeline.",
        "Build 10G traffic generation solution for throughput testing network analysis tools such as moloch, suricata, and Zeek (formerly Bro).",
        "On an X-710 network card we obtained 6 GB/s using tcpdump, DPDK pktgen to get 10GB/s, moongen for custom scripting of packets at 10 GB/s, and Breaking Point (paid solution) for 10GB/s of custom configurable traffic generation via a web interface.",
        "Integrated with Verodin for malware analysis to test the accuracy of the IDS (Intrusion Detection System).", "Implemented packer brokering on IXIA Extreme 40 for load balancing traffic based on session", "Worked on Jenkins build scripts including tests, reports on bugs and fixing ansible scripts for network IDS builds", "Worked on openvpn server and client setups for remote sensor installations. Also established IPSec tunnels connected to an ASA with DNS forwarding setup for access to multiple kits across different networks.",
        
      ],
    },
    {
      company: "Planet Labs",
      url: "https://www.planet.com/",
      title: "Senior Software Engineer",
      dateRange: "June 2017 - October 2018",
      bullets: [
        "<b>Languages:</b> Python, Go",
        "<b>Environment:</b> Kubernetes, Amazon EC2, GCP, Azure",
        "Deploy and manage OpenID Connect service for SalesForce Single Sign On (SSO)",
        "Migrate from ansible deployment to docker containers deployed into Kubernetes.",
        "Develop reports in kibana to analyze traffic to public API for debugging",
        "Manage the public data api, including finding and implementing solutions to geospatial and other issues in the public data api.",
        "Migrate postgreSQL databases and other services from AWS to Google Cloud (GCP).",
        "Worked on and fixed the cleaning up of geojson searches with too many point coordinates causing database load to reach critical state",
        "Worked on private Azure deployments for various entities",
        "Fixed an issue in the public API that happened when geospatial queries crossed the antimerdian."
      ],
    },
    {
      company: "Showroom Logic",
      title: "Senior Software Engineer",
      dateRange: "2013 - 2017",
      bullets: [
        "<b>Languages:</b> Python, PHP",
        "<b>Environment:</b> Amazon Opsworks (Chef cookbooks), Elastic Beanstalk (docker)",
        "Architect and implement the distributed ETL workflow to aggregate reporting data from multiple 3rd parties, primarily Google Adwords and Google Analytics.",
        "Implement a schedule of distributed tasks to generate executive reports for the business.",
        "SQL reports and front end applications for customers and internal business requirements.",
        "Developed web front ends for reporting systems using morris.js or d3.js charts.",
        "Lead team to build flask and django applications.",
        "Integrated tasks into an application that used Amazon’s SWF (Simple Workflow).",
        "Developed a distributed hosting application for dealer websites that increased conversion rates through better quality scores and provided efficient flow of traffic for 1000s of clients.",
        "Features included : caching with varnish, A/B testing and integration with Google Experiments, payment information integration via SOAP and REST APIs.",
        "Build a campaign management platform that automatically adjusted ad spend to the campaigns with the highest performance according to a proprietary ranking algorithm."
      ],
    },
    {
      company: "Rackspace",
      url: "https://www.rackspace.com/",
      title: "DevOps Engineer II / Quality Engineer (Private Cloud)",
      dateRange: "2013 - 2017",
      bullets: [
        "<b>Languages:</b> Java, Python, Ruby",
        "<b>Environment:</b> Openstack, Chef (infrastructure management), Jenkins",
        "<b>Team:</b> Private Cloud",
        "Rack servers and build automated API that used Razor bare-metal provisioning software to PXE boot a pool of servers with a set distribution of Centos, Fedora and Ubuntu bare-metal instances.",
        "Build API to pull from pool of servers and test feature sets specified.",
        "Integrate with Jenkins to automate testing of chef cookbooks via a git hook to an API endpoint",
        "Feature matrix included but not limited to : building cookbooks and testing authentication methods (database, LDAP, 389, OpenLDAP), cinder storage backends (LVM, EMC hardware, etc)",
        "Integration of different testing suites for testing private cloud deployments reliability.",
        "Built a web application in python to visualize the Rackspace Lab infrastructure and interact with multiple Openstack deployments."
      ],
    },
  ],
  education: [
    {
      school: "Texas State University",
      degree: "Bachelor of Science in Computer Science",
      dateRange: "2007 - 2011",
      achievements: [
        "Paid research assistant to Dr. Chen.",
        "Co-authored research paper w/ Dr. Chen", 
        "J. Curran, and X. Chen, 'A Minimization Problem in Wireless Sensor Networks', Proc. Of the International Conference on Parallel and Distributed Computing and Networks, February 2010."
      ],
    },
  ],
};
