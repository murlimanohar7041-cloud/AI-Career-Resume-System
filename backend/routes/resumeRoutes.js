const express = require("express");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { spawn } = require("child_process");
const path = require("path");
const pdfParseModule = require("pdf-parse");
const pdfParse =
    typeof pdfParseModule === "function"
        ? pdfParseModule
        : pdfParseModule.default;

const router = express.Router();

// ======================================================
// GEMINI AI
// ======================================================

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash"
});

// ======================================================
// MULTER
// ======================================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// ======================================================
// OCR FUNCTION
// ======================================================

async function extractTextFromImage(buffer) {

    console.log("OCR started...");

    const worker = await createWorker("eng");

    try {

        const result = await worker.recognize(buffer);

        const text = result.data.text;

        console.log("OCR completed.");

        return text;

    } finally {

        await worker.terminate();

    }
}

// ======================================================
// GEMINI RESUME ANALYSIS
// ======================================================

async function analyzeResumeWithAI(resumeText) {

    console.log("🤖 Gemini AI analysis started...");

    const prompt = `
You are an expert AI Career and Resume Intelligence system.

Analyze the following resume carefully.

Identify:

1. Candidate's actual career field
2. Current technical and professional skills
3. Suitable career paths
4. Missing skills
5. Personalized learning roadmap
6. Interview topics

IMPORTANT RULES:

- Do NOT assume the candidate is a software developer.
- Identify the field from the actual resume.
- If the resume is Digital Marketing, give a Digital Marketing roadmap.
- If the resume is Data Science, give a Data Science roadmap.
- If the resume is Finance, give a Finance roadmap.
- If the resume is HR, give an HR roadmap.
- If the resume is Sales, give a Sales roadmap.
- For any other field, create a roadmap specific to that field.
- Do not recommend programming, DSA or algorithms unless genuinely relevant.
- Use only information supported by the resume for current skills.
- You may recommend missing skills relevant to the recommended career.

Return ONLY valid JSON.

JSON format:

{
    "field": "Detected career field",
    "summary": "Short professional summary",
    "skills": [
        "skill 1",
        "skill 2"
    ],
    "careers": [
        "career 1",
        "career 2",
        "career 3"
    ],
    "skillGap": [
        "missing skill 1",
        "missing skill 2"
    ],
    "roadmap": [
        {
            "step": 1,
            "title": "Step title",
            "skills": [
                "skill"
            ],
            "description": "What the candidate should learn"
        }
    ],
    "interviewTopics": [
        "topic 1",
        "topic 2",
        "topic 3"
    ]
}

Resume:

${resumeText}
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    console.log("🤖 Gemini response received.");

    const cleanedResponse = response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    try {

        return JSON.parse(cleanedResponse);

    } catch (error) {

        console.error("Gemini JSON parsing failed:");
        console.error(response);

        throw new Error(
            "AI returned an invalid analysis format."
        );
    }
}

// ======================================================
// ML CAREER PREDICTION
// ======================================================

function predictCareerWithML(skills) {

    return new Promise((resolve, reject) => {

        if (!skills || !skills.length) {

            resolve(null);

            return;
        }

        const skillsText = Array.isArray(skills)
            ? skills.join(" ")
            : String(skills);

        console.log("🧠 Sending skills to ML model:");
        console.log(skillsText);

        const pythonScript = path.join(
            __dirname,
            "..",
            "..",
            "ml",
            "predict.py"
        );

        const mlFolder = path.join(
            __dirname,
            "..",
            "..",
            "ml"
        );

        console.log("🐍 Running ML:");
        console.log(pythonScript);

        const pythonProcess = spawn(
            "py",
            [pythonScript, skillsText],
            {
                cwd: mlFolder
            }
        );

        pythonProcess.on("error", (error) => {

            console.error(
                "🐍 Python process error:",
                error.message
            );

            reject(error);
        });

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on(
            "data",
            (data) => {

                output += data.toString();

            }
        );

        pythonProcess.stderr.on(
            "data",
            (data) => {

                errorOutput += data.toString();

            }
        );

        pythonProcess.on(
            "close",
            (code) => {

                console.log(
                    "🐍 ML process finished. Code:",
                    code
                );

                if (errorOutput) {

                    console.error(
                        "ML Error:",
                        errorOutput
                    );
                }

                if (code !== 0) {

                    reject(
                        new Error(
                            "ML prediction process failed."
                        )
                    );

                    return;
                }

                try {

                    const lines = output
                        .trim()
                        .split(/\r?\n/);

                    const jsonLine = lines
                        .reverse()
                        .find(
                            line =>
                                line.trim().startsWith("{")
                        );

                    if (!jsonLine) {

                        throw new Error(
                            "ML did not return valid JSON."
                        );
                    }

                    const result =
                        JSON.parse(jsonLine);

                    if (!result.success) {

                        throw new Error(
                            result.message ||
                            "Career prediction failed."
                        );
                    }

                    console.log(
                        "🎯 ML Predicted Career:",
                        result.career
                    );

                    resolve(
                        result.career
                    );

                } catch (error) {

                    console.error(
                        "ML JSON parsing error:",
                        error
                    );

                    reject(error);
                }
            }
        );
    });
}

// ======================================================
// RESUME ANALYZER
// ======================================================

router.post(
    "/analyze",
    upload.single("resume"),
    async (req, res) => {

        try {

            // ==================================================
            // CHECK FILE
            // ==================================================

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please upload a resume"

                });
            }

            console.log(
                "📄 File received:",
                req.file.originalname
            );

            console.log(
                "📄 File type:",
                req.file.mimetype
            );

            let text = "";

            // ==================================================
            // PDF
            // ==================================================

            if (
                req.file.mimetype ===
                "application/pdf"
            ) {

                console.log(
                    "PDF detected..."
                );

                console.log(
                    "Reading PDF text..."
                );

                // IMPORTANT:
                // pdf-parse@1.1.1
                // works with this syntax.

                const pdfData =
                    await pdfParse(
                        req.file.buffer
                    );

                text =
                    pdfData.text || "";

                console.log(
                    "PDF text extraction completed."
                );

                console.log(
                    "Extracted characters:",
                    text.length
                );

                if (!text.trim()) {

                    return res.status(400).json({

                        message:
                            "This PDF does not contain readable text. Please upload a text-based PDF."

                    });
                }
            }

            // ==================================================
            // JPG / PNG
            // ==================================================

            else if (

                req.file.mimetype ===
                    "image/jpeg" ||

                req.file.mimetype ===
                    "image/png" ||

                req.file.mimetype ===
                    "image/jpg"

            ) {

                console.log(
                    "Image detected..."
                );

                text =
                    await extractTextFromImage(
                        req.file.buffer
                    );
            }

            // ==================================================
            // INVALID FILE
            // ==================================================

            else {

                return res.status(400).json({

                    message:
                        "Only PDF, JPG and PNG files are supported."

                });
            }

            // ==================================================
            // CHECK TEXT
            // ==================================================

            if (!text.trim()) {

                return res.status(400).json({

                    message:
                        "Could not read text from this resume."

                });
            }

            console.log(
                "Resume text extracted successfully."
            );

            console.log(
                "Extracted resume text length:",
                text.length
            );

            // ==================================================
            // GEMINI ANALYSIS
            // ==================================================

            const aiAnalysis =
                await analyzeResumeWithAI(
                    text
                );

            console.log(
                "✅ AI resume analysis completed."
            );

            // ==================================================
            // ML CAREER PREDICTION
            // ==================================================

            let mlCareer = null;

            try {

                mlCareer =
                    await predictCareerWithML(
                        aiAnalysis.skills || []
                    );

            } catch (mlError) {

                console.error(
                    "⚠️ ML prediction failed:",
                    mlError.message
                );

                mlCareer = null;
            }

            // ==================================================
            // FINAL RESPONSE
            // ==================================================

            return res.json({

                message:
                    "Resume analyzed successfully",

                score:
                    calculateScore(
                        aiAnalysis.skills
                    ),

                field:
                    aiAnalysis.field || "",

                summary:
                    aiAnalysis.summary || "",

                skills:
                    aiAnalysis.skills || [],

                missingSkills:
                    aiAnalysis.skillGap || [],

                careers:
                    aiAnalysis.careers || [],

                roadmap:
                    aiAnalysis.roadmap || [],

                interviewTopics:
                    aiAnalysis.interviewTopics || [],

                mlCareer:
                    mlCareer

            });

        } catch (error) {

            console.error(
                "❌ Resume Analysis Error:",
                error
            );

            return res.status(500).json({

                message:
                    "Resume analysis failed",

                error:
                    error.message

            });
        }
    }
);

// ======================================================
// SCORE
// ======================================================

function calculateScore(skills) {

    if (
        !skills ||
        !skills.length
    ) {

        return 0;
    }

    const maxScore = 15;

    let score =
        Math.round(
            (skills.length / maxScore) *
            100
        );

    if (score > 100) {

        score = 100;
    }

    return score;
}

// ======================================================
// EXPORT
// ======================================================

module.exports = router;