// Your combined dictionary with English and Blurgen equivalents
const dictionary = {
    // Nouns
    'person':'shur',
    'people':'shurmi',
    'home':'hum',
    'friend':'blu',
    'hello':'gabba',
    'goodbye':'gabba',
    // Pronouns
    'i':'mur',
    'you':'[insert name here]',
    'me':'mur',
    'my':'mur',
    'we':'murmi',
    'this':'mo',
    'that':'bo',
    'that (far)':'fo',
    // Verbs
    'drink':'slu',
    'eat':'abu',
    'go':'shu',
    'read':'flobl',
    'teach':'blobl',
    'learn':'tobl',
    'see':'vi',
    'to be':'du',
    'is':'du',
    'are':'du',
    'am':'du',
    'say':'sa',
    // Adverbs
    'here':'mu',
    'there':'bu',
    'there (far)':'fu',
};

function translate(input, isEnglishToBlurgen) {
    const words = input.match(/\b\w+\b/g);
    const nonWords = input.split(/\b\w+\b/g);

    let output = '';
    for (let i = 0; i < nonWords.length; i++) {
        output += nonWords[i];
        if (words[i]) {
            if (isEnglishToBlurgen) {
                output += dictionary[words[i].toLowerCase()] || "[unknown]";
            } else {
                const translation = Object.keys(dictionary).find(key => dictionary[key] === words[i].toLowerCase());
                output += translation || "[unknown]";
            }
        }
    }
    return output || 'Translation not found';
}


function translateToBlurgen() {
    const englishInput = document.getElementById('englishInput').value;
    const blurgenOutput = translate(englishInput, true);
    document.getElementById('blurgenToEnglishOutput').innerText = blurgenOutput;
}

function translateToEnglish() {
    const blurgenInput = document.getElementById('blurgenInput').value;
    const englishOutput = translate(blurgenInput, false);
    document.getElementById('englishToBlurgenOutput').innerText = englishOutput;
}
