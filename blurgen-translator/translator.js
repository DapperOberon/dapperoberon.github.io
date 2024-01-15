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
    const charactersToKeep = ",./<>?;:'\"[{]}1234567890-=~!@#$%^&*()_+`";
    const words = input.split(/(\b|\W+)/);

    if (isEnglishToBlurgen) {
        const output = words.map(part => {
            if (charactersToKeep.includes(part[0]) || /\s/.test(part)) {
                return part;
            }
            return dictionary[part.toLowerCase()] || part;
        }).join('');
        return output || 'Translation not found';
    } else {
        const output = words.map(part => {
            if (charactersToKeep.includes(part[0]) || /\s/.test(part)) {
                return part;
            }
            return Object.keys(dictionary).find(key => dictionary[key].toLowerCase() === part) || part;
        }).join('');
        return output || 'Translation not found';
    }
}



function translateToBlurgen() {
    const englishInput = document.getElementById('englishInput').value;
    const blurgenOutput = translate(englishInput, true);
    document.getElementById('blurgenOutput').innerText = blurgenOutput;
}

function translateToEnglish() {
    const blurgenInput = document.getElementById('blurgenInput').value;
    const englishOutput = translate(blurgenInput, false);
    document.getElementById('englishOutput').innerText = englishOutput;
}