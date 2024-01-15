// Your combined dictionary with English and Blurgen equivalents
let dictionary = {}; // Initialize an empty dictionary

// Fetch and load the dictionary from the JSON file
fetch('dictionary.json')
    .then(response => response.json())
    .then(data => {
        dictionary = data;
    })
    .catch(error => console.error('Error loading dictionary:', error));

// The rest of your translation functions remain unchanged
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

// Translate when Enter key is pressed
function handleEnterPress(event, isEnglishToBlurgen) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default Enter key behavior (e.g., newline in textarea)
        if (isEnglishToBlurgen) {
            translateToBlurgen();
        } else {
            translateToEnglish();
        }
    }
}

// Other functions remain the same
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
