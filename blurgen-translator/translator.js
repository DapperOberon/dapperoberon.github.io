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
    let words = input.split(/([^\w'.]|(?<=\w)\.(?=\s|$))/);

    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        let lowerCaseWord = word && word.toLowerCase(); // Convert the word to lowercase for dictionary lookup
        let translation = word; // Default to the original word

        if (word && /\w+/.test(word)) { // Only translate words
            translation = "[unknown]";

            // Try to match phrases first
            if (i < words.length - 2 && /\w+/.test(words[i + 2])) {
                let phrase = lowerCaseWord + " " + words[i + 2].toLowerCase();
                if (i < words.length - 4 && /\w+/.test(words[i + 4])) {
                    let threeWordPhrase = phrase + " " + words[i + 4].toLowerCase();
                    if (isEnglishToBlurgen && englishToBlurgen[threeWordPhrase]) {
                        translation = englishToBlurgen[threeWordPhrase];
                        i += 4; // Skip the next four elements (two words and two punctuations)
                    } else if (!isEnglishToBlurgen && blurgenToEnglish[threeWordPhrase]) {
                        translation = blurgenToEnglish[threeWordPhrase];
                        i += 4; // Skip the next four elements (two words and two punctuations)
                    }
                }
                if (translation === "[unknown]") {
                    if (isEnglishToBlurgen && englishToBlurgen[phrase]) {
                        translation = englishToBlurgen[phrase];
                        i += 2; // Skip the next two elements (word and punctuation)
                    } else if (!isEnglishToBlurgen && blurgenToEnglish[phrase]) {
                        translation = blurgenToEnglish[phrase];
                        i += 2; // Skip the next two elements (word and punctuation)
                    }
                }
            }

            // If the phrase is not found, try to match individual words
            if (translation === "[unknown]") {
                if (isEnglishToBlurgen && englishToBlurgen[lowerCaseWord]) {
                    translation = englishToBlurgen[lowerCaseWord];
                } else if (!isEnglishToBlurgen && blurgenToEnglish[lowerCaseWord]) {
                    translation = blurgenToEnglish[lowerCaseWord];
                }
            }
        }

        // Preserve the original case
        if (word && word[0] === word[0].toUpperCase()) {
            translation = translation.charAt(0).toUpperCase() + translation.slice(1);
        }

        output += translation;
    }

    return output.trim() || 'Translation not found';
}

let translationTimeout;
// Translate when Enter key is pressed or after 1 second of inactivity
function handleInputChange(isEnglishToBlurgen) {
    clearTimeout(translationTimeout); // Clear previous timeout

    translationTimeout = setTimeout(() => {
        console.log("Translating...");
        if (isEnglishToBlurgen) {
            translateToBlurgen();
        } else {
            translateToEnglish();
        }
    }, 500);
}

// Translate when Enter key is pressed
/*function handleEnterPress(event, isEnglishToBlurgen) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default Enter key behavior (e.g., newline in textarea)
        if (isEnglishToBlurgen) {
            translateToBlurgen();
        } else {
            translateToEnglish();
        }
    }
}*/

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

// Event listeners for input changes
document.getElementById('englishInput').addEventListener('input', () => handleInputChange(true));
document.getElementById('blurgenInput').addEventListener('input', () => handleInputChange(false));

// Copy Blurgen to clipboard
function copyBlurgenToClipboard() {
    // Get the text field
    var copyText = document.getElementById("blurgenToEnglishOutput");
  
    // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.innerText)
    .then(() => {
        // Alert the copied text
        var tooltip = document.getElementById("blurgenTooltip");
        // Inside the copyBlurgenToClipboard and copyEnglishToClipboard functions
        tooltip.innerHTML = "Copied to Clipboard";
    })
    .catch(err => {
        console.error('Could not copy text: ', err);
    });
}

// Copy English to clipboard
function copyEnglishToClipboard() {
    // Get the text field
    var copyText = document.getElementById("englishToBlurgenOutput");
  
    // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.innerText)
    .then(() => {
        // Alert the copied text
        var tooltip = document.getElementById("englishTooltip");
        // Inside the copyBlurgenToClipboard and copyEnglishToClipboard functions
        tooltip.innerHTML = "Copied to Clipboard";
    })
    .catch(err => {
        console.error('Could not copy text: ', err);
    });
}