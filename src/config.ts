export const siteConfig = {
  name: "John Curran",
  title: "Senior DevOps / Software Engineer",
  description: "Portfolio website of John Curran",
  accentColor: "#135311ff",
  social: {
    email: "curran736@gmail.com",
    linkedin: "https://www.linkedin.com/in/john-curran-77957b39",
    github: "https://github.com/john5223",
  },
  aboutMe:
    "I am an experienced dev ops and software engineer who has a passion for building efficient software and also has empathy and humor to make it through the day as a team.",
  skills: ["Git", "Github Workflows", "ArgoCD", 
          "Kubernetes", "AWS", "GCP", "Azure", "Docker",
          "Python", "Go", "C/C++", "Java", "PHP", 
          "Javascript", "React", "Node.js",
          "PostgreSQL",
          "Hardware Setup"],
  projects: [
    {
      name: "Candle stick pattern analysis (coming soon)",
      description:
        "Analyze candle stick patterns in the stock market to look for reliable patterns to predict future market trends.",
      link: "/patterns",
      skills: ["Python", "Celery", "Pandas", "Numpy", "Redis", "TimescaleDB"],
    },
  ],
  experience: [
    {
      company: "Red Knight",
      url: "https://red-knight.com/",
      title: "DevSecOps Engineer - Air Force Contractor",
      dateRange: "July 2023 - August 2025",
      bullets: [
        "Hardware: PowerEdge R6515, Dell Powerswitch",
        "Languages: Python, Go",
        "Configuration: Kubernetes manifests, helm charts, zarf packages",
        "Build out deployable kits consisting of 10 PowerEdge servers clustered together using Kubernetes.",
        "Install and test offline package installation (via zarf) of network intrusion detection software which includes tools such as zeek, suricata, arkime, elasticsearch, etc into a kubernetes deployment.",
        "Built zarf packages for deploying applications. Zarf packages are helm charts and docker images packaged together for use in offline deployments of applications within a kubernetes deployment (https://zarf.dev)",
        "Setup Canonical’s MAAS software for setup of infrastructure components including Dell switches, firewall and kit servers via DHCP and PXE boot configurations.",
        "Building packer “golden” images for use by MAAS to PXE boot the servers into a RKE2 Kubernetes cluster.",
        "Automate OS10 Dell Powerswitch builds to configure the network for a deployable kit with a custom script utilizing paramiko.",
        "Debug issues all the way from hardware misconfigurations to helm charts to fixing 3rd party application code by checking logs and fixing python or go code.",
      ],
    },
    {
      company: "BrainGu",
      title: "DevSecOps Platform Engineer - Air Force Contractor",
      dateRange: "December 2020 - December 2021",
      bullets: [
        "Environment: GovCloud AWS, Kubernetes",
        "Contractor supporting Air Forces LevelUp program to deploy Kuberneres according to DoD's DevSecOps Reference Architecture",
        "Use rke3 to deploy kubernetes, flux to deploy platform applications, and argocd to deploy customer applications.",
        "Manage AWS infrastructure via terraform and gitops.",
        "Work with application teams to deploy their workloads into staging, test and production clusters.",
        "Integrate CSI drivers and other platform applications into kubernetes deployments.",
        "Use SAFe Agile process to run sprint planning, retrospectives, and daily stand ups.",
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
