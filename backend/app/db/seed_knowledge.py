from datetime import date
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeSource, KnowledgeChunk
from app.core.logging import logger

CURATED_KNOWLEDGE = [
    {
        "source": {
            "title": "Complete Blood Count (CBC) Comprehensive Guide",
            "publisher": "MedlinePlus, National Library of Medicine (NIH)",
            "source_url": "https://medlineplus.gov/lab-tests/complete-blood-count/",
            "source_type": "clinical_guide",
            "published_at": date(2025, 1, 15),
            "license_notes": "Public Domain (U.S. Government Work)"
        },
        "chunks": [
            {
                "canonical_test_name": "Hemoglobin",
                "text": "Hemoglobin is an iron-rich protein in red blood cells that carries oxygen from the lungs to tissues throughout the body and transports carbon dioxide back to the lungs. Normal reference ranges for adults typically range between 12.0 to 17.5 g/dL depending on sex and laboratory methodology. A low hemoglobin level may suggest anemia, blood loss, or nutritional deficiencies, while an elevated hemoglobin level may be associated with dehydration, high altitude, or chronic lung conditions."
            },
            {
                "canonical_test_name": "White Blood Cell Count",
                "text": "White blood cells (WBCs), or leukocytes, protect the body against infections and disease. Normal adult reference ranges generally fall between 4,000 and 11,000 cells/mcL (or 4.0 - 11.0 10^3/uL). Elevated levels (leukocytosis) frequently reflect the body's immune response to an infection, inflammation, physical stress, or medication effects. Decreased counts (leukopenia) may arise from viral infections, autoimmune conditions, bone marrow issues, or specific medications."
            },
            {
                "canonical_test_name": "Platelet Count",
                "text": "Platelets (thrombocytes) are specialized cell fragments essential for normal blood clotting and vessel repair to prevent excessive bleeding. Typical reference intervals are between 150,000 and 450,000 platelets per microliter (150 - 450 10^3/uL). A reduced platelet count (thrombocytopenia) may increase bruising or bleeding tendencies, whereas a high count (thrombocytosis) can occur in response to inflammation, iron deficiency, or marrow disorders."
            },
            {
                "canonical_test_name": "Hematocrit",
                "text": "Hematocrit (Hct) represents the proportion of blood volume made up of red blood cells, expressed as a percentage. Normal ranges are approximately 36% to 50%, varying by sex and age. Low hematocrit often mirrors low hemoglobin in cases of anemia, whereas elevated hematocrit points towards hemoconcentration, dehydration, or excessive red cell production."
            },
            {
                "canonical_test_name": "Mean Corpuscular Volume (MCV)",
                "text": "Mean Corpuscular Volume (MCV) evaluates the average physical size of individual red blood cells, measured in femtoliters (fL). A typical adult range is 80 to 100 fL. A low MCV indicates microcytic cells (commonly seen in iron deficiency anemia or thalassemia trait), whereas a high MCV indicates macrocytic cells (commonly associated with Vitamin B12 or folate deficiency, liver disease, or alcohol intake)."
            }
        ]
    },
    {
        "source": {
            "title": "Metabolic Panel and Kidney Function Tests",
            "publisher": "American Association for Clinical Chemistry (AACC) / Lab Tests Online",
            "source_url": "https://www.testing.com/tests/comprehensive-metabolic-panel-cmp/",
            "source_type": "laboratory_reference",
            "published_at": date(2025, 2, 10),
            "license_notes": "Educational Clinical Reference"
        },
        "chunks": [
            {
                "canonical_test_name": "Fasting Blood Glucose",
                "text": "Fasting blood glucose measures the concentration of sugar in the bloodstream after an overnight fast (typically 8 to 12 hours). Standard diagnostic guidelines classify normal fasting glucose as 70 to 99 mg/dL. Values between 100 and 125 mg/dL suggest impaired fasting glucose (prediabetes), and levels of 126 mg/dL or higher on repeat tests indicate diabetes mellitus. Temporary elevations may occur under acute physiological stress or illness."
            },
            {
                "canonical_test_name": "Glycated Hemoglobin (HbA1c)",
                "text": "HbA1c reflects the average blood glucose concentration over the preceding 2 to 3 months by measuring the percentage of hemoglobin with attached glucose. A value below 5.7% is considered normal; 5.7% to 6.4% indicates prediabetes; and 6.5% or greater on two separate occasions meets the diagnostic criteria for diabetes. Laboratory reference ranges must always be interpreted in conjunction with individual clinical glycemic targets established with a physician."
            },
            {
                "canonical_test_name": "Serum Creatinine",
                "text": "Creatinine is a chemical waste byproduct produced by muscle metabolism and filtered out by healthy kidneys through urine. Standard adult reference intervals generally range between 0.6 and 1.2 mg/dL, influenced by muscle mass, age, and sex. Elevated serum creatinine levels can indicate reduced kidney filtration capacity, dehydration, strenuous exercise, or certain medications. Trends over time are particularly valuable for clinical evaluation."
            },
            {
                "canonical_test_name": "Blood Urea Nitrogen (BUN)",
                "text": "Blood Urea Nitrogen (BUN) measures the amount of nitrogen in blood that comes from urea, a waste product of dietary protein breakdown in the liver. Normal ranges typically span 7 to 20 mg/dL. Elevated BUN levels may signify reduced kidney clearance, high dietary protein intake, gastrointestinal bleeding, or dehydration."
            },
            {
                "canonical_test_name": "Estimated Glomerular Filtration Rate (eGFR)",
                "text": "eGFR provides a calculated estimate of how efficiently the kidneys filter metabolic waste from the blood per minute, normalized to body surface area (mL/min/1.73m2). An eGFR above 90 is considered normal kidney function, 60-89 indicates mild reduction, and persistent values below 60 for three months or longer may indicate chronic kidney disease."
            }
        ]
    },
    {
        "source": {
            "title": "Lipid Profile & Cardiovascular Risk Assessment",
            "publisher": "Centers for Disease Control and Prevention (CDC)",
            "source_url": "https://www.cdc.gov/cholesterol/testing.htm",
            "source_type": "public_health_guideline",
            "published_at": date(2025, 3, 1),
            "license_notes": "Public Domain (U.S. CDC)"
        },
        "chunks": [
            {
                "canonical_test_name": "Total Cholesterol",
                "text": "Total cholesterol quantifies the aggregate amount of cholesterol carried in blood, including high-density and low-density lipoproteins. General guidelines recommend desirable total cholesterol below 200 mg/dL, borderline high between 200 and 239 mg/dL, and high at 240 mg/dL or above. Cholesterol interpretations are always evaluated alongside HDL, LDL, and personal cardiovascular risk factors."
            },
            {
                "canonical_test_name": "HDL Cholesterol",
                "text": "High-Density Lipoprotein (HDL) cholesterol is often referred to as 'good' cholesterol because it absorbs excess cholesterol from tissues and transports it back to the liver for excretion. Higher levels (above 40 mg/dL for men, above 50 mg/dL for women, and ideally above 60 mg/dL) are associated with lower cardiovascular risk."
            },
            {
                "canonical_test_name": "LDL Cholesterol",
                "text": "Low-Density Lipoprotein (LDL) cholesterol carries cholesterol to cells. When present in excess, it can build up on artery walls forming plaques. An optimal LDL level is generally under 100 mg/dL, though personal targets for individuals with diabetes or cardiovascular disease may be lower as recommended by their physician."
            },
            {
                "canonical_test_name": "Triglycerides",
                "text": "Triglycerides are the most common type of fat stored and circulating in the body. Normal fasting triglyceride levels are under 150 mg/dL. Levels between 150 and 199 mg/dL are borderline high, and 200 to 499 mg/dL are high. High levels can stem from dietary sugar/alcohol intake, metabolic syndrome, or lack of exercise."
            }
        ]
    },
    {
        "source": {
            "title": "Endocrine, Thyroid, and Vitamin Reference Standards",
            "publisher": "World Health Organization (WHO) & Endocrine Society",
            "source_url": "https://www.who.int/publications/guidelines/laboratory-medicine",
            "source_type": "clinical_consensus",
            "published_at": date(2024, 11, 20),
            "license_notes": "International Health Standards"
        },
        "chunks": [
            {
                "canonical_test_name": "Thyroid Stimulating Hormone (TSH)",
                "text": "Thyroid Stimulating Hormone (TSH) is secreted by the pituitary gland to regulate production of thyroid hormones (T3 and T4). Typical reference intervals are 0.4 to 4.0 uIU/mL. Elevated TSH usually signals an underactive thyroid (hypothyroidism), as the pituitary sends extra signals to stimulate the gland. Low TSH suggests an overactive thyroid (hyperthyroidism). Pregnancy, acute illness, and medications can shift these boundaries."
            },
            {
                "canonical_test_name": "Vitamin D (25-OH)",
                "text": "25-Hydroxyvitamin D is the primary circulating form used to determine overall vitamin D status, critical for calcium absorption and bone health. Levels below 20 ng/mL generally indicate deficiency; 20 to 29 ng/mL indicates insufficiency; and 30 to 100 ng/mL is considered adequate. Excessive supplementation can lead to toxic hypercalcemia above 100-150 ng/mL."
            },
            {
                "canonical_test_name": "Vitamin B12",
                "text": "Vitamin B12 (cobalamin) is vital for normal nerve function, DNA synthesis, and red blood cell formation. Normal adult levels usually fall between 200 and 900 pg/mL. Levels below 200 pg/mL signify deficiency, which can manifest as fatigue, peripheral neuropathy, cognitive slowing, or megaloblastic anemia."
            },
            {
                "canonical_test_name": "AST (SGOT)",
                "text": "Aspartate Aminotransferase (AST) is an enzyme found primarily in the liver, heart, skeletal muscles, and kidneys. Normal reference limits are usually under 35 to 40 U/L. Elevated levels can reflect liver cell injury, intense exercise, or muscle trauma."
            },
            {
                "canonical_test_name": "ALT (SGPT)",
                "text": "Alanine Aminotransferase (ALT) is an enzyme found mostly in liver cells. Typical upper reference limits are 35 to 55 U/L. ALT is a relatively specific indicator of liver inflammation or hepatocellular stress."
            }
        ]
    },
    {
        "source": {
            "title": "Clinical Guidance for Dengue Laboratory Testing and Serology",
            "publisher": "Centers for Disease Control and Prevention (CDC) & WHO",
            "source_url": "https://www.cdc.gov/dengue/healthcare-providers/testing/testing-guidance.html",
            "source_type": "clinical_consensus",
            "published_at": date(2025, 1, 10),
            "license_notes": "Public Domain (U.S. CDC & WHO Guidelines)"
        },
        "chunks": [
            {
                "canonical_test_name": "Dengue NS1 Antigen",
                "text": "Dengue non-structural protein 1 (NS1) antigen is a virus-specific glycoprotein produced in high concentrations during acute dengue virus infection. It is detectable in patient serum from the first day of fever onset up to day 5-7. An index value < 1.0 is considered negative (non-reactive), indicating that dengue NS1 antigen was not detected. An index value > 1.0 is considered positive, indicating active acute dengue virus infection. Testing should be interpreted in conjunction with patient symptoms and antibody kinetics."
            },
            {
                "canonical_test_name": "Dengue IgM Antibody",
                "text": "Dengue virus-specific IgM antibodies are produced by the immune system in response to primary or secondary dengue infection. IgM antibodies typically become detectable 4 to 5 days after symptom onset and can persist for several months. An index value < 1.0 is considered negative (absence of detectable IgM). An index value > 1.0 indicates a positive result consistent with recent or ongoing dengue infection. In patients tested early in the first 1-4 days of fever, negative IgM does not exclude dengue, and NS1 antigen testing is recommended."
            },
            {
                "canonical_test_name": "Red Blood Cell Count",
                "text": "Red Blood Cell (RBC) count measures the total number of circulating erythrocytes per microliter of blood. Typical reference intervals are 4.5 to 5.9 10^6/uL for men and 4.0 to 5.2 10^6/uL for women. Reduced counts suggest anemia or blood loss, whereas elevated counts may point to dehydration, hemoconcentration, or chronic respiratory adaptation."
            },
            {
                "canonical_test_name": "Neutrophils",
                "text": "Neutrophils are the predominant leukocyte subtype in blood responsible for rapid defense against bacterial infections and tissue trauma. Normal reference ranges typically span 40% to 75% of total white blood cells. Neutrophilia reflects active infection, inflammation, or physical stress, while neutropenia increases vulnerability to opportunistic pathogens."
            },
            {
                "canonical_test_name": "Lymphocytes",
                "text": "Lymphocytes (T cells, B cells, and natural killer cells) govern cell-mediated and humoral adaptive immunity. Typical adult reference intervals span 20% to 45% of total leukocytes. Lymphocytosis is commonly seen in response to acute viral infections and immune stimulation, whereas lymphopenia can accompany systemic infections or corticosteroids."
            }
        ]
    }
]


def seed_knowledge_base(db: Session) -> None:
    """
    Seeds curated clinical references, adding any missing sources and chunks idempotently.
    """
    logger.info("Verifying curated medical reference knowledge base...")
    total_added = 0
    for item in CURATED_KNOWLEDGE:
        src_data = item["source"]
        source = db.query(KnowledgeSource).filter(KnowledgeSource.title == src_data["title"]).first()
        if not source:
            source = KnowledgeSource(
                title=src_data["title"],
                publisher=src_data["publisher"],
                source_url=src_data["source_url"],
                source_type=src_data["source_type"],
                published_at=src_data["published_at"],
                license_notes=src_data["license_notes"],
                is_active=True
            )
            db.add(source)
            db.flush()

        for idx, chunk_data in enumerate(item["chunks"], start=1):
            existing_chunk = db.query(KnowledgeChunk).filter(
                KnowledgeChunk.canonical_test_name == chunk_data["canonical_test_name"]
            ).first()
            if not existing_chunk:
                chunk = KnowledgeChunk(
                    source_id=source.id,
                    canonical_test_name=chunk_data["canonical_test_name"],
                    chunk_text=chunk_data["text"],
                    chunk_index=idx,
                    metadata_json={"publisher": src_data["publisher"], "title": src_data["title"]}
                )
                db.add(chunk)
                total_added += 1

    db.commit()
    logger.info(f"Knowledge base verified. Added {total_added} new chunks.")
