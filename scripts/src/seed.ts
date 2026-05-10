import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { db, usersTable, papersTable, statusHistoryTable } = await import("@workspace/db");
const { eq } = await import("drizzle-orm");
const bcrypt = (await import("bcryptjs")).default;

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: "USER" | "VERIFIER" | "ADMIN";
  verifierLayer?: number;
  affiliation?: string;
}

const SEED_USERS: SeedUser[] = [
  { email: "admin@scipub.com", password: "Admin@123", name: "Admin User", role: "ADMIN" },
  { email: "firman.perdana@scipub.com", password: "Firman@123", name: "Firman Perdana", role: "VERIFIER", verifierLayer: 2, affiliation: "SciPub Editorial" },
  { email: "wikan@scipub.com", password: "Wikan@123", name: "Wikan", role: "VERIFIER", verifierLayer: 2, affiliation: "SciPub Editorial" },
  { email: "grandis@scipub.com", password: "Grandis@123", name: "Grandis", role: "VERIFIER", verifierLayer: 3, affiliation: "SciPub Editorial" },
  { email: "andi.pratama@gmail.com", password: "Andi@123", name: "Andi Pratama", role: "USER", affiliation: "Universitas Indonesia" },
  { email: "siti.nurhaliza@gmail.com", password: "Siti@123", name: "Siti Nurhaliza", role: "USER", affiliation: "Institut Teknologi Bandung" },
  { email: "budi.santoso@gmail.com", password: "Budi@123", name: "Budi Santoso", role: "USER", affiliation: "Universitas Gadjah Mada" },
];

interface SeedPaper {
  authorEmail: string;
  title: string;
  abstract: string;
  category: string;
  keywords: string[];
  coAuthors: string[];
  doi: string;
  publishedDaysAgo: number;
  content: string;
}

const SEED_PAPERS: SeedPaper[] = [
  {
    authorEmail: "andi.pratama@gmail.com",
    title: "Hybrid Transformer–Graph Neural Networks for Indonesian Text Classification",
    abstract:
      "We propose a hybrid architecture that combines pretrained Transformer encoders with graph neural networks (GNN) to model long-range dependencies in Bahasa Indonesia text. Experiments on three benchmark corpora (IndoNLU EmoT, SmSA, and a new healthcare misinformation dataset) show consistent improvements of 2.4–4.1 F1 over Transformer-only baselines, especially for documents longer than 256 tokens. We release pretrained weights, training pipelines, and the misinformation dataset to the community.",
    category: "Computer Science",
    keywords: ["NLP", "Transformer", "Graph Neural Network", "Bahasa Indonesia"],
    coAuthors: ["Dr. Rina Wijaya", "Prof. Hadi Susanto"],
    doi: "10.1234/scipub.demo.001",
    publishedDaysAgo: 14,
    content: [
      "Abstract",
      "We propose a hybrid Transformer–GNN architecture for Indonesian text classification.",
      "",
      "Introduction",
      "Indonesian NLP has progressed rapidly with the release of IndoBERT and IndoNLU. However, long-document classification remains challenging due to the quadratic cost of self-attention. We argue that complementing token-level attention with sentence-level message passing on a discourse graph captures long-range structure efficiently.",
      "",
      "Methodology",
      "Our model has three stages: (1) IndoBERT encoder produces token embeddings; (2) a sentence graph is constructed using cosine similarity over mean-pooled sentence vectors; (3) a 2-layer GAT propagates information across sentences before a classification head.",
      "",
      "Results",
      "On EmoT we obtain 78.9 F1 (+2.4 over IndoBERT-base). On SmSA we reach 92.1 (+3.0). On our healthcare misinformation set (16,402 articles) we obtain 86.4 F1 (+4.1).",
      "",
      "Conclusion",
      "Combining Transformer encoders with discourse-level GNNs is a promising direction for low-resource languages. Future work will explore retrieval-augmented variants.",
      "",
      "References",
      "[1] Wilie et al., IndoNLU, 2020. [2] Veličković et al., Graph Attention Networks, 2018.",
    ].join("\n"),
  },
  {
    authorEmail: "siti.nurhaliza@gmail.com",
    title: "Coastal Microplastic Distribution Along the Java Sea: A Two-Year Longitudinal Survey",
    abstract:
      "Microplastic pollution in Indonesian coastal waters poses growing risks to marine ecosystems and public health. We present a two-year longitudinal survey across twelve sampling sites along the northern Java coast, covering 2023–2024. Surface water and sediment samples were analyzed using FTIR spectroscopy. We find median surface concentrations of 4.7 particles/L, with significant elevation near river mouths during the wet season. Polypropylene and polyethylene dominate the polymer composition.",
    category: "Environmental Science",
    keywords: ["Microplastics", "Java Sea", "FTIR", "Marine Pollution"],
    coAuthors: ["Dr. Ratna Kusuma", "Ir. Bambang Priyono"],
    doi: "10.1234/scipub.demo.002",
    publishedDaysAgo: 7,
    content: [
      "Abstract",
      "Two-year longitudinal microplastic survey along the Java Sea coastline.",
      "",
      "Introduction",
      "Indonesia is among the largest contributors to marine plastic debris globally. Yet long-term, multi-site coastal data remain scarce. This study fills that gap with twelve sites sampled quarterly from January 2023 to December 2024.",
      "",
      "Methodology",
      "At each site, we collected 2L surface water and 1kg sediment per quarter. Samples were processed with H2O2 digestion, density separation, and identified using attenuated total reflectance FTIR.",
      "",
      "Results",
      "Median surface concentration was 4.7 particles/L (IQR 2.1–9.3). Sites near the Brantas and Solo river mouths showed 3.2× higher concentrations during the wet season. Polypropylene (38%) and polyethylene (29%) were dominant.",
      "",
      "Conclusion",
      "Riverine input drives seasonal variability. We recommend targeted upstream interventions and standardized monitoring protocols.",
      "",
      "References",
      "[1] Jambeck et al., Plastic waste inputs from land into the ocean, Science 2015.",
    ].join("\n"),
  },
  {
    authorEmail: "budi.santoso@gmail.com",
    title: "A Stochastic Compartmental Model for Dengue Outbreaks in Tropical Urban Settings",
    abstract:
      "We develop a stochastic SEIR-vector compartmental model calibrated against weekly dengue case data from three Indonesian cities (Jakarta, Surabaya, Yogyakarta) over the 2018–2023 period. Our model couples human and mosquito populations via a temperature-dependent transmission rate. Calibration uses approximate Bayesian computation. We show that incorporating rainfall lag of 4–6 weeks improves outbreak timing prediction by 18% in mean absolute error compared to a baseline deterministic SIR.",
    category: "Mathematics",
    keywords: ["Epidemiology", "Stochastic Modelling", "Dengue", "Bayesian Inference"],
    coAuthors: ["Dr. Maya Permata", "Prof. Soegiarto"],
    doi: "10.1234/scipub.demo.003",
    publishedDaysAgo: 30,
    content: [
      "Abstract",
      "Stochastic SEIR-vector model for dengue calibrated on three Indonesian cities.",
      "",
      "Introduction",
      "Dengue is endemic across tropical Indonesia and exhibits strong seasonality. Operational forecasting tools remain limited; we contribute a stochastic compartmental model designed for routine public-health use.",
      "",
      "Methodology",
      "The model couples a stochastic SEIR for humans with an SEI compartment for Aedes aegypti. Transmission rate β(t) depends on temperature via a Briere function and lagged rainfall via a moving average. Parameters are inferred with approximate Bayesian computation (ABC-SMC).",
      "",
      "Results",
      "Posterior predictive checks reproduce observed case curves within 90% credible intervals. Outbreak peak timing MAE drops from 3.6 weeks (deterministic SIR) to 2.9 weeks (our model).",
      "",
      "Conclusion",
      "Climate-coupled stochastic models are practical for operational dengue forecasting. We release code and weekly forecasts.",
      "",
      "References",
      "[1] Anderson & May, Infectious Diseases of Humans, 1991. [2] Sisson et al., ABC-SMC, 2007.",
    ].join("\n"),
  },
];

const FAKE_AI_REPORT = {
  score: 88,
  passed: true,
  wordCount: 4200,
  aiGeneratedLikelihood: 8,
  plagiarismScore: 4,
  structureComplete: true,
  citationValid: true,
  grammarScore: 92,
  issues: [],
};

async function seedUsers() {
  console.log(`Seeding ${SEED_USERS.length} users...`);
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const [inserted] = await db
      .insert(usersTable)
      .values({
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        verifierLayer: u.verifierLayer ?? null,
        affiliation: u.affiliation ?? null,
      })
      .onConflictDoNothing({ target: usersTable.email })
      .returning({ id: usersTable.id, email: usersTable.email });

    if (inserted) {
      console.log(`  + ${u.email} (${u.role}${u.verifierLayer ? ` L${u.verifierLayer}` : ""})`);
    } else {
      console.log(`  · ${u.email} already exists, skipped`);
    }
  }
}

async function seedPapers() {
  console.log(`Seeding ${SEED_PAPERS.length} papers...`);
  for (const p of SEED_PAPERS) {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.email, p.authorEmail));
    if (!author) {
      console.log(`  ! author ${p.authorEmail} not found, skipping "${p.title}"`);
      continue;
    }

    const publishedAt = new Date(Date.now() - p.publishedDaysAgo * 24 * 60 * 60 * 1000);

    const [inserted] = await db
      .insert(papersTable)
      .values({
        title: p.title,
        abstract: p.abstract,
        keywords: p.keywords,
        category: p.category,
        pdfUrl: "",
        content: p.content,
        coAuthors: p.coAuthors,
        authorId: author.id,
        status: "PUBLISHED",
        currentLayer: 3,
        doi: p.doi,
        aiReport: FAKE_AI_REPORT,
        publishedAt,
      })
      .onConflictDoNothing({ target: papersTable.doi })
      .returning({ id: papersTable.id, title: papersTable.title });

    if (inserted) {
      console.log(`  + "${inserted.title.slice(0, 60)}…" → published`);
      await db.insert(statusHistoryTable).values({
        paperId: inserted.id,
        fromStatus: "DRAFT",
        toStatus: "PUBLISHED",
        changedBy: "seed",
        note: "Seed data — auto-published",
      });
    } else {
      console.log(`  · "${p.title.slice(0, 60)}…" already exists, skipped`);
    }
  }
}

async function main() {
  await seedUsers();
  await seedPapers();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
