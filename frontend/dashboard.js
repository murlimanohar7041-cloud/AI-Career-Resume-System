let resumeAnalyzed = false;

function requireResume() {
    if (!resumeAnalyzed) {
        alert("Please upload and analyze your resume first.");
        return false;
    }

    return true;
}


// ======================================================
// 1. USER LOGIN CHECK
// ======================================================

const user = JSON.parse(
    localStorage.getItem("user")
);

if (!user) {
    window.location.href = "index.html";
}


// ======================================================
// 2. SHOW USER NAME
// ======================================================

const welcomeUser =
    document.getElementById("welcomeUser");

if (welcomeUser && user) {
    welcomeUser.innerText =
        `Welcome, ${user.name || "User"} 👋`;
}


// ======================================================
// 3. STORE AI ANALYSIS
// ======================================================

let resumeAnalysis = null;


// ======================================================
// 4. LOGOUT
// ======================================================

function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("resumeAnalysis");

    window.location.href = "index.html";
}


// ======================================================
// 5. RESUME ANALYZER
// ======================================================

async function analyzeResume() {

    const fileInput =
        document.getElementById("resumeFile");

    const message =
        document.getElementById("resumeMessage");

    const resultBox =
        document.getElementById("resumeResult");


    // ==================================================
    // CHECK FILE
    // ==================================================

    if (!fileInput || !fileInput.files.length) {

        if (message) {
            message.innerText =
                "⚠️ Please select your resume first.";
        }

        return;
    }


    const file =
        fileInput.files[0];


    // ==================================================
    // ALLOWED FILE TYPES
    // ==================================================

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg"
    ];

    if (!allowedTypes.includes(file.type)) {

        if (message) {
            message.innerText =
                "⚠️ Please upload PDF, JPG or PNG resume.";
        }

        return;
    }


    // ==================================================
    // FILE SIZE
    // ==================================================

    if (file.size > 10 * 1024 * 1024) {

        if (message) {
            message.innerText =
                "⚠️ Resume file must be smaller than 10 MB.";
        }

        return;
    }


    // ==================================================
    // LOADING
    // ==================================================

    if (message) {

        message.innerText =
            "⏳ AI is analyzing your resume... Please wait.";

        message.className =
            "loading-message";
    }

    if (resultBox) {
        resultBox.classList.add("hidden");
    }


    try {

        // ==================================================
        // FORM DATA
        // ==================================================

        const formData =
            new FormData();

        formData.append(
            "resume",
            file
        );

        formData.append(
            "userId",
            user.id
        );


        // ==================================================
        // BACKEND API
        // ==================================================

        const response =
            await fetch(
                "/api/resume/analyze",
                {
                    method: "POST",
                    body: formData
                }
            );


        // ==================================================
        // SAFE RESPONSE HANDLING
        // ==================================================

        const contentType =
            response.headers.get("content-type") || "";

        let data;

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Server returned non-JSON response:",
                text
            );

            throw new Error(
                "Server returned an invalid response."
            );
        }


        // ==================================================
        // SERVER ERROR
        // ==================================================

        if (!response.ok) {

            if (message) {

                message.innerText =
                    data.message ||
                    "❌ Resume analysis failed.";

                message.className =
                    "error-message";
            }

            return;
        }


        // ==================================================
        // SAVE ANALYSIS
        // ==================================================

        resumeAnalysis =
            data;

        resumeAnalyzed = true;


        // ==================================================
        // SUCCESS
        // ==================================================

        if (message) {

            message.innerText =
                "✅ Resume analyzed successfully!";

            message.className =
                "success-message";
        }

        if (resultBox) {
            resultBox.classList.remove("hidden");
        }


        // ==================================================
        // SCORE
        // ==================================================

        const resumeScore =
            document.getElementById(
                "resumeScore"
            );

        if (resumeScore) {

            resumeScore.innerText =
                `${data.score || 0}%`;
        }


        // ==================================================
        // CAREER FIELD
        // ==================================================

        const detectedField =
            document.getElementById(
                "detectedField"
            );

        if (detectedField) {

            detectedField.innerText =
                data.field ||
                "Career field not detected.";
        }


        // ==================================================
        // SUMMARY
        // ==================================================

        const resumeSummary =
            document.getElementById(
                "resumeSummary"
            );

        if (resumeSummary) {

            resumeSummary.innerText =
                data.summary ||
                "No AI summary available.";
        }


        // ==================================================
        // SKILLS
        // ==================================================

        const detectedSkills =
            document.getElementById(
                "detectedSkills"
            );

        if (detectedSkills) {

            if (
                data.skills &&
                Array.isArray(data.skills) &&
                data.skills.length
            ) {

                detectedSkills.innerHTML =
                    data.skills
                        .map(
                            skill =>
                                `<span class="skill-tag">
                                    ${escapeHTML(skill)}
                                </span>`
                        )
                        .join("");

            } else {

                detectedSkills.innerHTML =
                    `<span class="empty-result">
                        No skills detected.
                    </span>`;
            }
        }


        // ==================================================
        // SKILL GAP
        // ==================================================

        const missingSkills =
            document.getElementById(
                "missingSkills"
            );

        if (missingSkills) {

            if (
                data.missingSkills &&
                Array.isArray(data.missingSkills) &&
                data.missingSkills.length
            ) {

                missingSkills.innerHTML =
                    data.missingSkills
                        .map(
                            skill =>
                                `<span class="skill-gap">
                                    ${escapeHTML(skill)}
                                </span>`
                        )
                        .join("");

            } else {

                missingSkills.innerHTML =
                    `<span class="empty-result">
                        🎉 No major skill gaps detected.
                    </span>`;
            }
        }


        // ==================================================
        // CAREERS
        // ==================================================

        const recommendedCareers =
            document.getElementById(
                "recommendedCareers"
            );

        if (recommendedCareers) {

            if (
                data.careers &&
                Array.isArray(data.careers) &&
                data.careers.length
            ) {

                recommendedCareers.innerHTML =
                    data.careers
                        .map(
                            career =>
                                `<div class="career-item">
                                    <span>💼</span>
                                    <strong>
                                        ${escapeHTML(career)}
                                    </strong>
                                </div>`
                        )
                        .join("");

            } else {

                recommendedCareers.innerHTML =
                    `<span class="empty-result">
                        No recommendations available.
                    </span>`;
            }
        }


        // ==================================================
        // ML PREDICTED CAREER
        // ==================================================

        const mlPredictedCareer =
            document.getElementById(
                "mlPredictedCareer"
            );

        if (mlPredictedCareer) {

            if (data.mlCareer) {

                mlPredictedCareer.innerText =
                    data.mlCareer;

            } else {

                mlPredictedCareer.innerText =
                    "ML prediction not available.";
            }
        }


        // ==================================================
        // CAREER READINESS
        // ==================================================

        const readinessScore =
            document.getElementById(
                "score"
            );

        if (readinessScore) {

            readinessScore.innerText =
                `${data.score || 0}%`;
        }


        // ==================================================
        // SCROLL TO RESULT
        // ==================================================

        if (resultBox) {

            setTimeout(() => {

                resultBox.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }, 300);
        }

    }

    catch (error) {

        console.error(
            "Resume Analysis Error:",
            error
        );

        if (message) {

            message.innerText =
                "❌ Server connection failed. Make sure backend is running on port 5000.";

            message.className =
                "error-message";
        }
    }
}


// ======================================================
// 6. ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// 7. SHOW FEATURE
// ======================================================

function showFeature(title, content) {

    const featureResult =
        document.getElementById(
            "featureResult"
        );

    const featureTitle =
        document.getElementById(
            "featureTitle"
        );

    const featureContent =
        document.getElementById(
            "featureContent"
        );


    if (
        !featureResult ||
        !featureTitle ||
        !featureContent
    ) {

        console.error(
            "Feature result elements not found."
        );

        return;
    }


    featureTitle.innerText =
        title;

    featureContent.innerHTML =
        content;

    featureResult.classList.remove(
        "hidden"
    );

    featureResult.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ======================================================
// 8. CLOSE FEATURE
// ======================================================

function closeFeature() {

    const featureResult =
        document.getElementById(
            "featureResult"
        );

    if (featureResult) {

        featureResult.classList.add(
            "hidden"
        );
    }
}


// ======================================================
// 9. CHECK RESUME
// ======================================================

function checkResume() {

    if (!resumeAnalyzed || !resumeAnalysis) {

        showFeature(
            "⚠️ Resume Required",
            `
                <div class="empty-feature">

                    <div class="empty-feature-icon">
                        📄
                    </div>

                    <h3>
                        Analyze Your Resume First
                    </h3>

                    <p>
                        Please upload and analyze your resume
                        before using AI career features.
                    </p>

                    <button
                        onclick="scrollToResume()"
                    >
                        Upload Resume
                    </button>

                </div>
            `
        );

        return false;
    }

    return true;
}


// ======================================================
// 10. SCROLL TO RESUME
// ======================================================

function scrollToResume() {

    const analyzer =
        document.querySelector(
            ".resume-analyzer"
        );

    if (analyzer) {

        analyzer.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


// ======================================================
// 11. CAREER RECOMMENDATION
// ======================================================

function showCareerRecommendation() {

    if (!checkResume()) {
        return;
    }

    const careers =
        resumeAnalysis.careers || [];

    const mlCareer =
        resumeAnalysis.mlCareer || null;

    const field =
        resumeAnalysis.field ||
        "Your career field";


    let html = `

        <div class="feature-intro">

            <div class="big-feature-icon">
                🎯
            </div>

            <div>

                <h3>
                    AI Career Recommendation
                </h3>

                <p>
                    Career recommendations based on
                    your resume, skills and ML prediction.
                </p>

            </div>

        </div>
    `;


    // ==================================================
    // ML PREDICTED CAREER
    // ==================================================

    if (mlCareer) {

        html += `

            <div class="ml-career-card">

                <span class="result-card-label">
                    🧠 ML PREDICTION
                </span>

                <h3>
                    ${escapeHTML(mlCareer)}
                </h3>

                <p>
                    This career was predicted by the
                    Machine Learning model using your
                    detected resume skills.
                </p>

            </div>
        `;
    }


    // ==================================================
    // DETECTED FIELD
    // ==================================================

    html += `

        <div class="result-card">

            <span class="result-card-label">
                DETECTED FIELD
            </span>

            <h3>
                ${escapeHTML(field)}
            </h3>

        </div>

        <h4>
            Recommended Career Paths
        </h4>

        <div class="career-list">
    `;


    // ==================================================
    // GEMINI CAREER RECOMMENDATIONS
    // ==================================================

    if (careers.length) {

        careers.forEach(
            (career, index) => {

                html += `

                    <div class="career-result-item">

                        <div class="career-result-number">
                            ${index + 1}
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(career)}
                            </strong>

                            <p>
                                Recommended based on your
                                resume profile and skills.
                            </p>

                        </div>

                    </div>
                `;
            }
        );

    } else {

        html += `

            <div class="empty-result-box">
                No additional career recommendations available.
            </div>

        `;
    }


    html += `

        </div>

        <div class="feature-tip">

            💡 Your ML prediction and AI career
            recommendations are generated from
            your resume skills and career profile.

        </div>
    `;


    showFeature(
        "🎯 Career Recommendation",
        html
    );
}


// ======================================================
// 12. SKILL GAP ANALYSIS
// ======================================================

function showSkillGap() {

    if (!checkResume()) {
        return;
    }

    const gaps =
        resumeAnalysis.missingSkills || [];

    const field =
        resumeAnalysis.field ||
        "your career field";


    let html = `

        <div class="feature-intro">

            <div class="big-feature-icon">
                🧠
            </div>

            <div>

                <h3>
                    Skill Gap Analysis
                </h3>

                <p>
                    Skills that can improve your profile
                    for ${escapeHTML(field)}.
                </p>

            </div>

        </div>


        <div class="result-card">

            <span class="result-card-label">
                TARGET CAREER
            </span>

            <h3>
                ${escapeHTML(field)}
            </h3>

        </div>


        <h4>
            Skills to Improve
        </h4>


        <div class="skill-gap-list">
    `;


    if (gaps.length) {

        gaps.forEach(
            skill => {

                html += `

                    <div class="skill-gap-result-item">

                        <span>
                            ⚠️
                        </span>

                        <strong>
                            ${escapeHTML(skill)}
                        </strong>

                    </div>
                `;
            }
        );

    } else {

        html += `

            <div class="empty-result-box">
                🎉 No major skill gaps detected.
            </div>

        `;
    }


    html += `

        </div>

        <div class="feature-tip">

            💡 Focus on the most relevant skills first
            instead of learning unrelated technologies.

        </div>
    `;


    showFeature(
        "🧠 Skill Gap Analysis",
        html
    );
}


// ======================================================
// 13. JOB MATCHER
// ======================================================

function showJobMatcher() {

    if (!checkResume()) {
        return;
    }

    const skills =
        resumeAnalysis.skills || [];

    const careers =
        resumeAnalysis.careers || [];

    const score =
        resumeAnalysis.score || 0;


    let html = `

        <div class="feature-intro">

            <div class="big-feature-icon">
                💼
            </div>

            <div>

                <h3>
                    AI Job Matcher
                </h3>

                <p>
                    Your resume currently matches best
                    with these career roles.
                </p>

            </div>

        </div>


        <div class="match-score-card">

            <div class="match-score">

                <span>
                    ${score}%
                </span>

            </div>

            <div>

                <strong>
                    Resume Match Strength
                </strong>

                <p>
                    Based on your current resume analysis.
                </p>

            </div>

        </div>


        <h4>
            Matching Career Roles
        </h4>


        <div class="career-list">
    `;


    if (careers.length) {

        careers.forEach(
            career => {

                html += `

                    <div class="career-result-item">

                        <div class="career-result-number">
                            ✓
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(career)}
                            </strong>

                            <p>
                                Good match with your
                                current profile.
                            </p>

                        </div>

                    </div>
                `;
            }
        );

    } else {

        html += `

            <div class="empty-result-box">
                No matching career found.
            </div>

        `;
    }


    html += `

        </div>


        <h4>
            Your Current Skills
        </h4>


        <div class="skills-container">
    `;


    if (skills.length) {

        skills.forEach(
            skill => {

                html += `

                    <span class="skill-tag">
                        ${escapeHTML(skill)}
                    </span>

                `;
            }
        );

    } else {

        html += `
            No skills detected.
        `;
    }


    html += `

        </div>


        <div class="feature-tip">

            💡 A future version can compare your resume
            directly with a job description and calculate
            an exact job-match percentage.

        </div>
    `;


    showFeature(
        "💼 Job Matcher",
        html
    );
}

// ======================================================
// 14. LEARNING ROADMAP
// ======================================================

function showLearningRoadmap() {

    if (!checkResume()) {
        return;
    }

    const roadmap =
        resumeAnalysis.roadmap || [];

    const field =
        resumeAnalysis.field ||
        "your career field";


    let html = `

        <div class="feature-intro">

            <div class="big-feature-icon">
                📚
            </div>

            <div>

                <h3>
                    Personalized Learning Roadmap
                </h3>

                <p>
                    A career roadmap designed for
                    ${escapeHTML(field)}.
                </p>

            </div>

        </div>


        <div class="roadmap-list">
    `;


    if (roadmap.length) {

        roadmap.forEach(
            (item, index) => {

                html += `

                    <div class="roadmap-step">

                        <div class="roadmap-number">
                            ${item.step || index + 1}
                        </div>


                        <div class="roadmap-content">

                            <span class="roadmap-label">
                                STEP ${item.step || index + 1}
                            </span>


                            <h3>
                                ${escapeHTML(
                                    item.title ||
                                    "Learning Step"
                                )}
                            </h3>


                            <p>

                                <strong>
                                    Skills:
                                </strong>

                                ${
                                    item.skills &&
                                    item.skills.length
                                        ? item.skills
                                            .map(
                                                skill =>
                                                    escapeHTML(skill)
                                            )
                                            .join(", ")
                                        : "Not specified"
                                }

                            </p>


                            <p>
                                ${escapeHTML(
                                    item.description ||
                                    "Learn and practice these skills."
                                )}
                            </p>

                        </div>

                    </div>
                `;
            }
        );

    } else {

        html += `

            <div class="empty-result-box">

                📚 AI roadmap is not available yet.
                Please analyze your resume again.

            </div>

        `;
    }


    html += `

        </div>
    `;


    showFeature(
        "📚 Learning Roadmap",
        html
    );
}


// ======================================================
// 15. AI INTERVIEW STATE
// ======================================================

let interviewState = {

    questions: [],

    currentQuestion: 0,

    answers: [],

    scores: [],

    startTime: null,

    timerInterval: null

};


// ======================================================
// 16. SHOW AI INTERVIEW
// ======================================================

function showAIInterview() {

    if (!checkResume()) {
        return;
    }

    const topics =
        resumeAnalysis.interviewTopics || [];

    const field =
        resumeAnalysis.field ||
        "your career field";

    const skills =
        resumeAnalysis.skills || [];


    let html = `

        <div class="feature-intro">

            <div class="big-feature-icon">
                🎤
            </div>

            <div>

                <h3>
                    AI Interview Simulator
                </h3>

                <p>
                    Experience a realistic AI-powered
                    interview based on your resume,
                    skills and career field.
                </p>

            </div>

        </div>


        <div class="interview-info-grid">


            <div class="interview-info-card">

                <span>🎯</span>

                <strong>
                    Target Role
                </strong>

                <p>
                    ${escapeHTML(field)}
                </p>

            </div>


            <div class="interview-info-card">

                <span>❓</span>

                <strong>
                    Questions
                </strong>

                <p>
                    ${topics.length || 5}
                    Questions
                </p>

            </div>


            <div class="interview-info-card">

                <span>⏱️</span>

                <strong>
                    Interview Type
                </strong>

                <p>
                    AI Mock Interview
                </p>

            </div>


            <div class="interview-info-card">

                <span>📄</span>

                <strong>
                    Resume Based
                </strong>

                <p>
                    Personalized
                </p>

            </div>

        </div>


        <div class="interview-preparation-box">

            <h4>
                👨‍💼 Before You Begin
            </h4>

            <ul>

                <li>
                    Answer each question as if you are
                    sitting in a real interview.
                </li>

                <li>
                    Keep your answers clear and
                    professional.
                </li>

                <li>
                    Use examples from your projects,
                    skills and experience.
                </li>

                <li>
                    The AI will evaluate your answer
                    after every question.
                </li>

            </ul>

        </div>


        <div class="interview-skills-box">

            <h4>
                🧠 Resume Skills Being Considered
            </h4>

            <div class="skills-container">
    `;


    if (skills.length) {

        skills.forEach(
            skill => {

                html += `

                    <span class="skill-tag">

                        ${escapeHTML(skill)}

                    </span>

                `;
            }
        );

    } else {

        html += `

            <span class="empty-result">

                Resume skills will be considered
                during the interview.

            </span>

        `;
    }


    html += `

            </div>

        </div>


        <div class="interview-ready-box">

            <div class="interview-ready-icon">
                🎤
            </div>


            <h3>
                Ready for your interview?
            </h3>


            <p>
                The AI interviewer will ask questions
                one by one. Answer naturally and
                professionally.
            </p>


            <button
                class="interview-start-btn"
                onclick="startInterview()"
            >

                🎤 Start Realistic Interview

            </button>

        </div>
    `;


    showFeature(
        "🎤 AI Interview Simulator",
        html
    );
}


// ======================================================
// 17. PREPARE INTERVIEW QUESTIONS
// ======================================================

function prepareInterviewQuestions() {

    const field =
        resumeAnalysis.field ||
        "your career field";

    const topics =
        resumeAnalysis.interviewTopics || [];

    const skills =
        resumeAnalysis.skills || [];

    const careers =
        resumeAnalysis.careers || [];


    let questions = [];


    // ==================================================
    // INTRODUCTION
    // ==================================================

    questions.push(
        `Tell me about yourself and your background in ${field}.`
    );


    // ==================================================
    // SKILL QUESTION
    // ==================================================

    if (skills.length) {

        questions.push(
            `I noticed that you have experience with ${skills[0]}. Can you explain how you have used this skill in a project or practical situation?`
        );

    } else {

        questions.push(
            `What are your strongest technical skills, and how have you applied them in practical projects?`
        );
    }


    // ==================================================
    // PROJECT QUESTION
    // ==================================================

    questions.push(
        `Can you describe one of your projects and explain what problem you were trying to solve, what your role was, and what you learned from it?`
    );


    // ==================================================
    // CAREER QUESTION
    // ==================================================

    if (careers.length) {

        questions.push(
            `Why are you interested in pursuing a career as a ${careers[0]}?`
        );

    } else {

        questions.push(
            `Why are you interested in building your career in ${field}?`
        );
    }


    // ==================================================
    // TOPIC QUESTION
    // ==================================================

    if (topics.length) {

        const topic =
            topics[
                Math.floor(
                    Math.random() * topics.length
                )
            ];

        questions.push(
            `Let's discuss ${topic}. How would you explain your understanding of this topic and where is it useful?`
        );

    } else {

        questions.push(
            `What is one technical concept related to ${field} that you understand well? Explain it in simple terms.`
        );
    }


    return questions;
}


// ======================================================
// 18. START INTERVIEW
// ======================================================

function startInterview() {

    if (!checkResume()) {
        return;
    }


    interviewState.questions =
        prepareInterviewQuestions();

    interviewState.currentQuestion =
        0;

    interviewState.answers =
        [];

    interviewState.scores =
        [];

    interviewState.startTime =
        new Date();


    startInterviewTimer();

    showInterviewQuestion();
}


// ======================================================
// 19. INTERVIEW TIMER
// ======================================================

function startInterviewTimer() {

    if (interviewState.timerInterval) {

        clearInterval(
            interviewState.timerInterval
        );
    }


    interviewState.timerInterval =
        setInterval(() => {

            const timer =
                document.getElementById(
                    "interviewTimer"
                );


            if (!timer) {
                return;
            }


            const start =
                interviewState.startTime;

            const now =
                new Date();


            const seconds =
                Math.floor(
                    (now - start) / 1000
                );


            const minutes =
                Math.floor(
                    seconds / 60
                );


            const remainingSeconds =
                seconds % 60;


            timer.innerText =
                `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

        }, 1000);
}


// ======================================================
// 20. SHOW CURRENT QUESTION
// ======================================================

function showInterviewQuestion() {

    const questions =
        interviewState.questions;

    const index =
        interviewState.currentQuestion;

    const question =
        questions[index];

    const total =
        questions.length;


    const progress =
        Math.round(
            ((index + 1) / total) * 100
        );


    showFeature(

        "🎤 AI Interview — Live",

        `

        <div class="live-interview-header">

            <div class="interviewer-profile">

                <div class="interviewer-avatar">
                    👨‍💼
                </div>

                <div>

                    <strong>
                        AI Interviewer
                    </strong>

                    <span>
                        ● Interview in progress
                    </span>

                </div>

            </div>


            <div class="interview-timer-box">

                ⏱️

                <span id="interviewTimer">
                    00:00
                </span>

            </div>

        </div>


        <div class="interview-progress-section">

            <div class="interview-progress-info">

                <span>
                    Question ${index + 1}
                    of ${total}
                </span>

                <span>
                    ${progress}%
                </span>

            </div>


            <div class="interview-progress-bar">

                <div
                    class="interview-progress-fill"
                    style="width:${progress}%"
                ></div>

            </div>

        </div>


        <div class="ai-interviewer-message">

            <div class="ai-message-icon">
                🤖
            </div>

            <div>

                <span class="ai-message-label">
                    AI INTERVIEWER
                </span>

                <p>
                    ${escapeHTML(question)}
                </p>

            </div>

        </div>


        <div class="interview-answer-section">

            <label>
                Your Answer
            </label>


            <textarea
                id="interviewAnswer"
                class="interview-answer"
                rows="8"
                placeholder="Take a moment to think, then type your answer as if you were speaking to the interviewer..."
            ></textarea>


            <div class="answer-helper">

                💡 Tip: Give a specific example
                whenever possible.

            </div>


            <button
                class="interview-submit-btn"
                onclick="submitInterviewAnswer()"
            >

                🎯 Submit Answer

            </button>

        </div>


        <div
            id="interviewFeedback"
            class="interview-feedback"
        ></div>

        `
    );
}


// ======================================================
// 21. SUBMIT INTERVIEW ANSWER
// ======================================================

function submitInterviewAnswer() {

    const answer =
        document.getElementById(
            "interviewAnswer"
        );

    const feedback =
        document.getElementById(
            "interviewFeedback"
        );


    if (
        !answer ||
        !feedback
    ) {
        return;
    }


    const text =
        answer.value.trim();


    // ==================================================
    // EMPTY ANSWER
    // ==================================================

    if (!text) {

        feedback.innerHTML = `

            <div class="feedback-warning">

                ⚠️

                <strong>
                    Please answer the question first.
                </strong>

                <p>
                    Try to answer as you would in
                    a real interview.
                </p>

            </div>

        `;

        return;
    }


    // ==================================================
    // SHORT ANSWER
    // ==================================================

    if (text.length < 40) {

        feedback.innerHTML = `

            <div class="feedback-warning">

                <h4>
                    ⚠️ Your answer needs more detail
                </h4>

                <p>
                    A real interviewer would usually
                    expect a little more explanation.
                    Try adding your experience,
                    approach or an example.
                </p>

            </div>

        `;

        return;
    }


    // ==================================================
    // SAVE ANSWER
    // ==================================================

    interviewState.answers.push(
        text
    );


    // ==================================================
    // CALCULATE SCORE
    // ==================================================

    let score = 60;


    if (text.length >= 80) {
        score += 10;
    }


    if (text.length >= 150) {
        score += 10;
    }


    if (
        /example|project|experience|result|learned|problem|solution/i.test(
            text
        )
    ) {
        score += 10;
    }


    if (
        /because|therefore|however|also|first|then|finally/i.test(
            text
        )
    ) {
        score += 5;
    }


    score =
        Math.min(
            score,
            95
        );


    interviewState.scores.push(
        score
    );


    // ==================================================
    // FEEDBACK
    // ==================================================

    let feedbackText =
        "Your answer is relevant and shows good communication.";


    if (score >= 85) {

        feedbackText =
            "Excellent answer. You explained your thoughts clearly and included useful details.";

    } else if (score >= 75) {

        feedbackText =
            "Good answer. You covered the main point, but adding a specific example could make it stronger.";

    } else {

        feedbackText =
            "Your answer has a good starting point. Try adding more detail, context and a real example.";
    }


    const isLast =
        interviewState.currentQuestion >=
        interviewState.questions.length - 1;


    feedback.innerHTML = `

        <div class="interview-evaluation">

            <div class="evaluation-score">

                <span>
                    ${score}
                </span>

                <small>
                    / 100
                </small>

            </div>


            <div class="evaluation-content">

                <h4>
                    🤖 AI Evaluation
                </h4>

                <p>
                    ${feedbackText}
                </p>


                <div class="evaluation-points">

                    <span>
                        ✓ Relevance
                    </span>

                    <span>
                        ✓ Communication
                    </span>

                    <span>
                        ✓ Detail
                    </span>

                </div>

            </div>

        </div>


        <div class="interview-feedback-tip">

            💡

            <strong>
                Interview Tip:
            </strong>

            Try using the STAR approach:

            Situation → Task → Action → Result.

        </div>


        <button
            class="next-interview-btn"
            onclick="${
                isLast
                    ? "finishInterview()"
                    : "nextInterviewQuestion()"
            }"
        >

            ${
                isLast
                    ? "🏁 Finish Interview"
                    : "➡️ Next Question"
            }

        </button>

    `;


    answer.disabled =
        true;


    const submitButton =
        document.querySelector(
            ".interview-submit-btn"
        );


    if (submitButton) {

        submitButton.disabled =
            true;
    }
}


// ======================================================
// 22. NEXT QUESTION
// ======================================================

function nextInterviewQuestion() {

    interviewState.currentQuestion++;


    if (
        interviewState.currentQuestion >=
        interviewState.questions.length
    ) {

        finishInterview();

        return;
    }


    showInterviewQuestion();
}


// ======================================================
// 23. FINISH INTERVIEW
// ======================================================

function finishInterview() {

    if (interviewState.timerInterval) {

        clearInterval(
            interviewState.timerInterval
        );

        interviewState.timerInterval =
            null;
    }


    const scores =
        interviewState.scores;


    let averageScore =
        0;


    if (scores.length) {

        averageScore =
            Math.round(
                scores.reduce(
                    (a, b) => a + b,
                    0
                ) / scores.length
            );
    }


    let performance =
        "Needs Improvement";


    let message =
        "Keep practicing and try to give more detailed answers.";


    if (averageScore >= 85) {

        performance =
            "Excellent";

        message =
            "Great job! Your answers showed strong communication and interview confidence.";

    } else if (averageScore >= 75) {

        performance =
            "Good";

        message =
            "Good performance. With a little more practice, your interview answers can become stronger.";

    } else if (averageScore >= 60) {

        performance =
            "Average";

        message =
            "You have a good foundation. Focus on giving structured answers with real examples.";
    }


    showFeature(

        "🏁 Interview Completed",

        `

        <div class="interview-complete-box">

            <div class="complete-icon">
                🏆
            </div>


            <h2>
                Interview Completed!
            </h2>


            <p>
                You have successfully completed
                your AI mock interview.
            </p>


            <div class="final-interview-score">

                <span>
                    ${averageScore}
                </span>

                <small>
                    / 100
                </small>

            </div>


            <h3>
                ${performance}
            </h3>


            <p class="final-interview-message">
                ${message}
            </p>


            <div class="interview-summary-grid">

                <div>

                    <strong>
                        ${interviewState.questions.length}
                    </strong>

                    <span>
                        Questions
                    </span>

                </div>


                <div>

                    <strong>
                        ${interviewState.answers.length}
                    </strong>

                    <span>
                        Answers
                    </span>

                </div>


                <div>

                    <strong>
                        ${averageScore}%
                    </strong>

                    <span>
                        Score
                    </span>

                </div>

            </div>


            <div class="final-interview-tips">

                <h4>
                    🎯 Improve Your Interview
                </h4>


                <ul>

                    <li>
                        Give specific project examples.
                    </li>

                    <li>
                        Explain your personal contribution.
                    </li>

                    <li>
                        Keep answers structured and concise.
                    </li>

                    <li>
                        Practice speaking confidently.
                    </li>

                </ul>

            </div>


            <button
                class="interview-start-btn"
                onclick="startInterview()"
            >

                🔄 Practice Again

            </button>

        </div>

        `
    );
}


// ======================================================
// IMPORTANT
// ======================================================
// DO NOT ADD ANY "RESTORE PREVIOUS ANALYSIS"
// localStorage code below this line.
//
// Resume analysis is intentionally kept only
// in the current page/session.
//
// If the user refreshes the dashboard,
// resumeAnalyzed becomes false again and
// the resume must be uploaded and analyzed again.
// ======================================================