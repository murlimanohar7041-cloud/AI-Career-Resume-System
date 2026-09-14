const model = require("./career_model.json");

function tokenize(text) {
    return text
        .toLowerCase()
        .match(/\b[\w#+.-]+\b/g) || [];
}

function createFeatures(text) {
    const tokens = tokenize(text);
    const features = [];

    for (const token of tokens) {
        features.push(token);
    }

    for (let i = 0; i < tokens.length - 1; i++) {
        features.push(
            tokens[i] + " " + tokens[i + 1]
        );
    }

    return features;
}

function predictCareer(skills) {

    const text = Array.isArray(skills)
        ? skills.join(" ")
        : String(skills || "");

    if (!text.trim()) {
        return null;
    }

    const features = createFeatures(text);

    const scores = new Array(
        model.classes.length
    ).fill(0);

    for (const feature of features) {

        const index =
            model.vocabulary[feature];

        if (index === undefined) {
            continue;
        }

        const idf =
            model.idf[index];

        const value = idf;

        for (
            let classIndex = 0;
            classIndex < model.classes.length;
            classIndex++
        ) {

            scores[classIndex] +=
                value *
                model.coefficients[classIndex][index];
        }
    }

    for (
        let i = 0;
        i < scores.length;
        i++
    ) {
        scores[i] += model.intercept[i];
    }

    let bestIndex = 0;

    for (
        let i = 1;
        i < scores.length;
        i++
    ) {
        if (scores[i] > scores[bestIndex]) {
            bestIndex = i;
        }
    }

    return model.classes[bestIndex];
}

module.exports = {
    predictCareer
};