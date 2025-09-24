const fs = require('fs');
const chalk = require('chalk');

module.exports = {
    input: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/*.{js,jsx,ts,tsx}',
        // 'src/**/*.{js,jsx,ts,tsx}', // Add your source code directories
        '!app/**/*.spec.{js,jsx,ts,tsx}',
        '!app/i18n/**',
        '!**/node_modules/**',
        '!./locales/**', // Important: Exclude the locales folder from input scanning
    ],
    output: './locales/', // Directs all output to the 'locales' folder
    options: {
        verbose: true,
        debug: true,
        func: {
            list: ['t', 'i18n.t'],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        trans: {
            component: 'Trans',
            i18nKey: 'i18nKey',
            defaultsKey: 'defaults',
            extensions: ['.js', '.jsx', '.ts', 'tsx'],
            fallbackKey: function(ns, value) {
                return value;
            },
            supportBasicHtmlNodes: true,
            keepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
            acorn: {
                ecmaVersion: 2020,
                sourceType: 'module',
            }
        },
        // Expanded list of languages with country-language standard codes
        lngs: [
            'en-US', 'az-AZ', 'ru-RU', 'tr-TR', 'de-DE', 'fr-FR', 'es-ES', 'it-IT',
            'pt-BR', 'ja-JP', 'zh-CN', 'ko-KR', 'ar-SA', 'hi-IN', 'pl-PL', 'ro-RO',
            'uk-UA', 'cs-CZ', 'nl-NL', 'sv-SE', 'da-DK', 'fi-FI', 'no-NO', 'id-ID',
            'fil-PH'
        ],
        ns: [
            'translation', // Default namespace
        ],
        defaultLng: 'en-US', // Update default language to match the new format
        defaultNs: 'translation',
        defaultValue: '__STRING_NOT_TRANSLATED__', // Default value for untranslated keys
        // Updated paths to save to and load from the 'locales' folder
        resource: {
            loadPath: './{{lng}}/{{ns}}.json',
            savePath: './{{lng}}/{{ns}}.json',
            jsonIndent: 2,
            lineEnding: '\n'
        },
        nsSeparator: false, // Use single-level JSON files
        keySeparator: false, // Use single-level JSON files
        interpolation: {
            prefix: '{{',
            suffix: '}}'
        },
        metadata: {},
        allowDynamicKeys: false,
    },
    // The transform function remains the same
    transform: function customTransform(file, enc, done) {
        "use strict";
        const parser = this.parser;
        const content = fs.readFileSync(file.path, enc);
        let count = 0;

        parser.parseFuncFromString(content, { list: ['i18next.t', 'i18n.t', 't'] }, (key, options) => {
            parser.set(key, Object.assign({}, options, {
                nsSeparator: false,
                keySeparator: false
            }));
            count++;
        });

        if (count > 0) {
            console.log(`i18next-scanner: count=${chalk.cyan(count)}, file=${chalk.yellow(JSON.stringify(file.relative))}`);
        }

        done();
    }
};