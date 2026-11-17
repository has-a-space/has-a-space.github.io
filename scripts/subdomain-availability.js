/* scripts/subdomain-availability.js
 * MIT Licence — (c) 2020-Present is-a.dev, (c) Clove Twilight
 */

const REGISTER_RAW = "https://raw.githubusercontent.com/meowed-at-me/register/main";
const DOMAIN_PATTERN = /^[a-zA-Z0-9_][a-zA-Z0-9.-]*/;

let isSearching = false;
let reservedDomains;
let searchTimeout;

const searchDomain = document.getElementById("search-domain");
const resultCard = document.getElementById("result-card");
const resultNone = document.getElementById("result-none");
const resultError = document.getElementById("result-error");
const resultReserved = document.getElementById("result-reserved");
const userAvatar = document.getElementById("user-avatar");
const userGitHubLink = document.getElementById("user-gh");
const userGitHubName = document.getElementById("user-gh-name");

async function fetchReservedDomains() {
    try {
        const response = await fetch(`${REGISTER_RAW}/util/reserved.json`);

        // A missing reserved list just means nothing is reserved yet
        if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to fetch reserved domains: ${response.statusText}`);
        }

        reservedDomains = response.ok ? await response.json() : [];
    } catch (error) {
        console.error(error.message);
        reservedDomains = [];
    }

    searchDomain.disabled = false;

    const params = new URLSearchParams(window.location.search);
    const subdomain = params.get("d");
    searchDomain.placeholder = `e.g. ${subdomain || "clove"}`;
}

function hideResults() {
    [
        resultCard,
        resultNone,
        resultError,
        resultReserved,
    ].forEach((element) => element.classList.add("hidden"));
}

function isReserved(domain) {
    return reservedDomains.some((pattern) => {
        if (pattern === domain) return true;

        // Entries with a character class are regex patterns
        return /\[/.test(pattern) && new RegExp(pattern).test(domain);
    });
}

async function check() {
    const search = searchDomain.value.trim().replace(/\s/g, "-").toLowerCase();
    if (!search || isSearching) return;

    hideResults();

    if (isReserved(search)) {
        resultReserved.classList.remove("hidden");
        return;
    }

    isSearching = true;

    try {
        const response = await fetch(`${REGISTER_RAW}/domains/${search}.json`);

        if (!response.ok && response.status !== 404) {
            throw new Error("Something went wrong");
        }

        const data = response.ok ? await response.json() : null;

        if (data) {
            showOwner(data.owner.username);
        } else {
            resultNone.classList.remove("hidden");
        }
    } catch (error) {
        console.error(error.message);
        resultError.classList.remove("hidden");
    } finally {
        isSearching = false;
    }
}

function showOwner(username) {
    const githubUrl = `https://github.com/${username}`;

    resultCard.classList.remove("hidden");
    userAvatar.src = `${githubUrl}.png?size=64`;
    userGitHubLink.href = githubUrl;
    userGitHubName.textContent = username;
}

searchDomain.addEventListener("input", function () {
    const inputValue = this.value.trim();

    clearTimeout(searchTimeout);

    if (!inputValue) {
        hideResults();
        return;
    }

    const matchedValue = inputValue.match(DOMAIN_PATTERN);
    if (matchedValue) {
        searchDomain.value = matchedValue[0];
    }

    searchTimeout = setTimeout(check, 1000);
});

fetchReservedDomains();
