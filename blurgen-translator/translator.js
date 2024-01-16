// Your combined dictionary with English and Blurgen equivalents
let dictionary = {}; // Initialize an empty dictionary
// split the dictionary into a hash map
let englishToBlurgen = {};
let blurgenToEnglish = {};

// Fetch and load the dictionary from the JSON file
fetch('dictionary.json')
    .then(response => response.json())
    .then(data => {
        dictionary = data;

        // Create the hash maps after the dictionary is loaded
        for (let category in dictionary) {
            for (let item of dictionary[category]) {
                englishToBlurgen[item.english] = item.blurgen;
                blurgenToEnglish[item.blurgen] = item.english;
            }
        }
    })
    .catch(error => console.error('Error loading dictionary:', error));

// The rest of your translation functions remain unchanged
function translate(input, isEnglishToBlurgen) {
    let output = '';
    let words = input.split(/([^\w']+)/);

    for (let i = 0; i < words.length; i++) {
        let word = words[i].toLowerCase();
        let translation = word; // Default to the original word

        if (/\w+/.test(word)) { // Only translate words
            translation = "[unknown]";

            // Try to match phrases first
            if (i < words.length - 2 && /\w+/.test(words[i + 2])) {
                let phrase = word + " " + words[i + 2];
                if (isEnglishToBlurgen && englishToBlurgen[phrase]) {
                    translation = englishToBlurgen[phrase];
                    i += 2; // Skip the next two elements (word and punctuation)
                } else if (!isEnglishToBlurgen && blurgenToEnglish[phrase]) {
                    translation = blurgenToEnglish[phrase];
                    i += 2; // Skip the next two elements (word and punctuation)
                }
            }

            // If the phrase is not found, try to match individual words
            if (translation === "[unknown]") {
                if (isEnglishToBlurgen && englishToBlurgen[word]) {
                    translation = englishToBlurgen[word];
                } else if (!isEnglishToBlurgen && blurgenToEnglish[word]) {
                    translation = blurgenToEnglish[word];
                }
            }
        }

        output += translation;
    }

    return output.trim() || 'Translation not found';
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

// Update the textboxes
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
