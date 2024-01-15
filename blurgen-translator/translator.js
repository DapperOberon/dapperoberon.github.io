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
    let output = '';
    let words = input.split(/(\W+)/); // Split on non-word characters

    for (let i = 0; i < words.length; i++) {
        let word = words[i].toLowerCase();
        let translation = word; // Default to the original word

        if (/\w+/.test(word)) { // Only translate words
            translation = "[unknown]";

            // Try to match phrases first
            if (i < words.length - 2 && /\w+/.test(words[i + 2])) {
                let phrase = word + " " + words[i + 2];
                for (let category in dictionary) {
                    for (let item of dictionary[category]) {
                        if (isEnglishToBlurgen && item.english === phrase) {
                            translation = item.blurgen;
                            i += 2; // Skip the next two elements (word and punctuation)
                            break;
                        } else if (!isEnglishToBlurgen && item.blurgen === phrase) {
                            translation = item.english;
                            i += 2; // Skip the next two elements (word and punctuation)
                            break;
                        }
                    }
                }
            }

            // If the phrase is not found, try to match individual words
            if (translation === "[unknown]") {
                for (let category in dictionary) {
                    for (let item of dictionary[category]) {
                        if (isEnglishToBlurgen && item.english === word) {
                            translation = item.blurgen;
                            break;
                        } else if (!isEnglishToBlurgen && item.blurgen === word) {
                            translation = item.english;
                            break;
                        }
                    }
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
