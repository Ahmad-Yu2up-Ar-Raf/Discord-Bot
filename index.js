const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const tmdbApiKey = process.env.TMDB_API_KEY;
const tmdbApiUrl = 'https://api.themoviedb.org/3';
const tmdbImageBaseUrl = 'https://image.tmdb.org/t/p/w500';

const recommendedIds = new Set();


// Array untuk menyimpan fakta-fakta film
const funFacts = [
    {
        text: "Did you know that the film 'Inception' was inspired by a lucid dream?",
        color: '#FF4500', // Orange
        icon: '🎬'
    },
    {
        text: "Did you know that the movie 'Parasite' was the first non-English language film to win Best Picture at the Oscars?",
        color: '#FFD700', // Gold
        icon: '🏆'
    },
    {
        text: "Did you know that the longest film ever made is 'The Cure for Insomnia' (1987), which is 85 hours long!",
        color: '#00FF00', // Lime Green
        icon: '⏳'
    },
    {
        text: "Did you know that James Cameron drew the famous nude portrait of Kate Winslet in 'Titanic'?",
        color: '#1E90FF', // Dodger Blue
        icon: '🎨'
    },
    {
        text: "Did you know that in 'The Godfather', the cat held by Marlon Brando was a stray found on the set?",
        color: '#FF6347', // Tomato
        icon: '🐱'
    },
    {
        text: "Did you know that the iconic 'Star Wars' opening crawl was inspired by the serials of the 1930s and 1940s?",
        color: '#8A2BE2', // Blue Violet
        icon: '⭐'
    },
    {
        text: "Did you know that the first feature-length animated film was Disney's 'Snow White and the Seven Dwarfs' (1937)?",
        color: '#FF1493', // Deep Pink
        icon: '❄️'
    },
    {
        text: "Did you know that in 'The Shawshank Redemption', the actor who played the warden, Bob Gunton, had to deliver his lines while standing in a pool of fake rain?",
        color: '#00CED1', // Dark Turquoise
        icon: '🌧️'
    },
    {
        text: "Did you know that the movie 'Jaws' (1975) led to a massive increase in the popularity of beach vacations?",
        color: '#20B2AA', // Light Sea Green
        icon: '🏖️'
    },
    {
        text: "Did you know that in 'Psycho' (1960), the infamous shower scene was filmed using chocolate syrup as fake blood?",
        color: '#FF69B4', // Hot Pink
        icon: '🚿'
    },
    {
        text: "Did you know that the sound of the TIE Fighters in 'Star Wars' was created by combining the sound of a whale and a jet engine?",
        color: '#BA55D3', // Medium Orchid
        icon: '🚀'
    },
    {
        text: "Did you know that the 2014 film 'Interstellar' included real scientific theories proposed by physicist Kip Thorne, who served as a scientific advisor for the film?",
        color: '#4B0082', // Indigo
        icon: '🪐'
    },
    {
        text: "Did you know that the movie 'Avatar' (2009) used groundbreaking motion capture technology to create its lush alien world of Pandora?",
        color: '#7FFF00', // Chartreuse
        icon: '🌌'
    },
    {
        text: "Did you know that in 'The Matrix' (1999), the green tint used throughout the film symbolizes the digital world?",
        color: '#32CD32', // Lime Green
        icon: '💻'
    },
    {
        text: "Did you know that Stanley Kubrick’s film '2001: A Space Odyssey' (1968) was one of the first films to use realistic space travel imagery?",
        color: '#6495ED', // Cornflower Blue
        icon: '🛰️'
    }
];

// Shuffle the array using the Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Shuffle the fun facts array and initialize the index
let shuffledFacts = shuffleArray([...funFacts]);
let currentIndex = 0;

// Sample quiz questions
const quizQuestions = [
    { question: "Who directed the film 'Inception'?", options: ["Christopher Nolan", "Steven Spielberg", "James Cameron", "Martin Scorsese"], answer: "Christopher Nolan" },
    { question: "Which movie won the Best Picture Oscar in 2020?", options: ["Parasite", "1917", "Once Upon a Time in Hollywood", "Joker"], answer: "Parasite" },
    { question: "What is the highest-grossing film of all time?", options: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"], answer: "Avatar" },
    { question: "Which actor played the character of 'The Joker' in the 2019 movie 'Joker'?", options: ["Joaquin Phoenix", "Heath Ledger", "Jared Leto", "Jack Nicholson"], answer: "Joaquin Phoenix" },
    { question: "Which film features the quote, 'I'll be back'?", options: ["Terminator", "Predator", "Robocop", "Die Hard"], answer: "Terminator" },
    { question: "Who composed the music for the 'Star Wars' series?", options: ["John Williams", "Hans Zimmer", "James Horner", "Danny Elfman"], answer: "John Williams" },
    { question: "What is the name of the fictional African country in 'Black Panther'?", options: ["Wakanda", "Zamunda", "Genovia", "Latveria"], answer: "Wakanda" },
    { question: "Which film features the character 'Jack Dawson'?", options: ["Titanic", "Romeo + Juliet", "The Great Gatsby", "Catch Me If You Can"], answer: "Titanic" },
    { question: "Which animated film is about a lost fish named Nemo?", options: ["Finding Nemo", "Shark Tale", "The Little Mermaid", "Moana"], answer: "Finding Nemo" },
    { question: "Which director is known for the 'Dark Knight' trilogy?", options: ["Christopher Nolan", "Tim Burton", "Zack Snyder", "Sam Raimi"], answer: "Christopher Nolan" }
];
// Map to track quiz state for each user
const userQuizState = new Map();

client.once(Events.ClientReady, () => {
    console.log('Bot is online!');
});

client.login(process.env.DISCORD_TOKEN);



client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    
    const { commandName, options ,customId, user } = interaction;

    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('Available Commands')
            .setDescription(`
                **/film [movie name]**: Search for movie information.\n
                **/tv [series name]**: Search for TV series information.\n
                **/recommend**: Get a random movie or TV series recommendation.\n
                **/hi**: Greet the bot.\n
                **/quiz**: Start a movie quiz.
            `)
            .setColor('#00FF00')
            .setFooter({ text: 'Requested by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
    
        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'film') {
        const movieName = options.getString('name');
        try {
            const searchResponse = await axios.get(`${tmdbApiUrl}/search/movie`, {
                params: {
                    api_key: tmdbApiKey,
                    query: movieName
                }
            });

            if (searchResponse.data.results.length > 0) {
                const movie = searchResponse.data.results[0];
                const movieId = movie.id;

                const creditsResponse = await axios.get(`${tmdbApiUrl}/movie/${movieId}/credits`, {
                    params: {
                        api_key: tmdbApiKey
                    }
                });

                const cast = creditsResponse.data.cast.slice(0, 5);
                const castList = cast.map(actor => `${actor.name} as ${actor.character}`).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle(movie.title)
                    .setDescription(`${movie.overview}\n\n**Release Date:** ${movie.release_date}\n**Rating:** ${movie.vote_average}\n\n**Cast:**\n${castList}`)
                    .setImage(`${tmdbImageBaseUrl}${movie.poster_path}`)
                    .setColor('#FFA500')
                    .setFooter({ text: 'Requested by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

                const moreInfoButton = new ButtonBuilder()
                    .setLabel('More Info')
                    .setURL(`https://www.themoviedb.org/movie/${movie.id}`)
                    .setStyle(ButtonStyle.Link);

                const row = new ActionRowBuilder().addComponents(moreInfoButton);

                await interaction.reply({ embeds: [embed], components: [row] });
            } else {
                await interaction.reply('Film tidak ditemukan.');
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('Terjadi kesalahan saat mencari film.');
        }
    }

    if (commandName === 'tv') {
        const seriesName = options.getString('name');
        try {
            const searchResponse = await axios.get(`${tmdbApiUrl}/search/tv`, {
                params: {
                    api_key: tmdbApiKey,
                    query: seriesName
                }
            });

            if (searchResponse.data.results.length > 0) {
                const series = searchResponse.data.results[0];
                const seriesId = series.id;

                const creditsResponse = await axios.get(`${tmdbApiUrl}/tv/${seriesId}/credits`, {
                    params: {
                        api_key: tmdbApiKey
                    }
                });

                const cast = creditsResponse.data.cast.slice(0, 5);
                const castList = cast.map(actor => `${actor.name} as ${actor.character}`).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle(series.name)
                    .setDescription(`${series.overview}\n\n**First Air Date:** ${series.first_air_date}\n**Rating:** ${series.vote_average}\n\n**Cast:**\n${castList}`)
                    .setImage(`${tmdbImageBaseUrl}${series.poster_path}`)
                    .setColor('#1E90FF')
                    .setFooter({ text: 'Requested by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

                const moreInfoButton = new ButtonBuilder()
                    .setLabel('More Info')
                    .setURL(`https://www.themoviedb.org/tv/${series.id}`)
                    .setStyle(ButtonStyle.Link);

                const row = new ActionRowBuilder().addComponents(moreInfoButton);

                await interaction.reply({ embeds: [embed], components: [row] });
            } else {
                await interaction.reply('TV series tidak ditemukan.');
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('Terjadi kesalahan saat mencari TV series.');
        }
    }
    
    if (commandName === 'recommend') {
        const type = options.getString('type') || 'movie';
    
        try {
            // Generate random page number between 1 and 10 for greater diversity
            const randomPage = Math.floor(Math.random() * 10) + 1;
    
            // Fetch content from both popular and top-rated categories
            const topRatedResponse = await axios.get(`${tmdbApiUrl}/${type}/top_rated`, {
                params: {
                    api_key: tmdbApiKey,
                    language: 'en-US',
                    page: randomPage
                }
            });
    
            const popularResponse = await axios.get(`${tmdbApiUrl}/${type}/popular`, {
                params: {
                    api_key: tmdbApiKey,
                    language: 'en-US',
                    page: randomPage
                }
            });
    
            // Merge results from both categories
            const allResults = [...topRatedResponse.data.results, ...popularResponse.data.results];
    
            // Filter content with good rating (e.g., rating >= 7) and popularity
            const filteredTitles = allResults.filter(item => item.vote_average >= 7 && item.popularity > 50);
    
            if (filteredTitles.length > 0) {
                // Filter out titles that have already been recommended
                const availableTitles = filteredTitles.filter(item => !recommendedIds.has(item.id));
    
                if (availableTitles.length === 0) {
                    // Reset recommended IDs if all titles have been used, but retain some history
                    recommendedIds.clear();
                    availableTitles.push(...filteredTitles.filter(item => !recommendedIds.has(item.id)));
                }
    
                // Pick a random recommendation from the available titles
                const recommendation = availableTitles[Math.floor(Math.random() * availableTitles.length)];
    
                // Add the recommendation ID to the set of recommended IDs
                recommendedIds.add(recommendation.id);
    
                // Prepare image URL
                const posterUrl = recommendation.poster_path ? `${tmdbImageBaseUrl}${recommendation.poster_path}` : 'https://via.placeholder.com/500x750';
    
                // Build embed message
                const embed = new EmbedBuilder()
                    .setTitle(type === 'movie' ? recommendation.title : recommendation.name)
                    .setDescription(`${recommendation.overview}\n\n**Release Date:** ${recommendation.release_date || recommendation.first_air_date}\n**Rating:** ${recommendation.vote_average}`)
                    .setImage(posterUrl)
                    .setColor('#32CD32')
                    .setFooter({ text: 'Requested by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
    
                // Button for more info
                const moreInfoButton = new ButtonBuilder()
                    .setLabel('More Info')
                    .setURL(`https://www.themoviedb.org/${type}/${recommendation.id}`)
                    .setStyle(ButtonStyle.Link);
    
                const row = new ActionRowBuilder().addComponents(moreInfoButton);
    
                // Reply with embed and button
                await interaction.reply({ embeds: [embed], components: [row] });
            } else {
                await interaction.reply('Tidak ada rekomendasi yang tersedia dengan rating yang bagus.');
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error.response ? error.response.data : error.message);
            await interaction.reply('Terjadi kesalahan saat mencari rekomendasi.');
        }
    };
    
   
    if (commandName === 'funfact') {
        // Check if all facts have been shown
        if (currentIndex >= shuffledFacts.length) {
            shuffledFacts = shuffleArray([...funFacts]); // Reshuffle and restart
            currentIndex = 0;
        }
    
        const currentFact = shuffledFacts[currentIndex];
        currentIndex++;
    
        const funFactEmbed = new EmbedBuilder()
            .setColor(currentFact.color)
            .setTitle(`${currentFact.icon} Random Fun Fact`)
            .setDescription(`Did you know?\n\n${currentFact.text}`)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp(); // Adds the current timestamp
    
        await interaction.reply({ embeds: [funFactEmbed] });
    }
    
   
if (commandName === 'hi') {
    const displayName = interaction.user.username;

    // Membuat embed yang lebih kaya
    const embed = new EmbedBuilder()
        .setTitle('👋 Hello!')
        .setDescription(`Hi, **${displayName}**! How can I assist you today?`)
        .setColor('#FFA500') // Warna biru cerah
        .setThumbnail(interaction.user.displayAvatarURL()) // Menampilkan avatar pengguna
        .setImage('https://example.com/welcome-image.png') // Menambahkan gambar (opsional)
        .addFields(
            { name: 'Help', value: 'Use `/help` to see what I can do!' },
            { name: 'Support', value: 'For support, visit [our website](https://example.com).' }
        ) // Menambahkan fields tambahan
        .setFooter({ text: 'Your friendly bot', iconURL: 'https://example.com/bot-icon.png' }) // Menambahkan footer
        .setTimestamp(); // Menambahkan timestamp

    await interaction.reply({ embeds: [embed] });
}
   
      if (commandName === 'quiz') {
        const userId = user.id;
    
        if (!userQuizState.has(userId)) {
            userQuizState.set(userId, { questionIndex: 0 });
        }
    
        const userState = userQuizState.get(userId);
        const { questionIndex } = userState;
    
        if (questionIndex >= quizQuestions.length) {
            userQuizState.delete(userId);
            return await interaction.reply('Quiz selesai!🥳🎉🍿 Terima kasih telah berpartisipasi.');
        }
    
        const currentQuestion = quizQuestions[questionIndex];
    
        const colors = ['#0099ff', '#ff5733', '#33ff57', '#5733ff', '#ff33a8', '#33ffa5', '#ffa533', '#a533ff', '#33d4ff', '#ffb833'];
        const embedColor = colors[questionIndex % colors.length];
    
        const embed = new EmbedBuilder()
            .setTitle(`Question ${questionIndex + 1}`)
            .setDescription(currentQuestion.question)
            .setColor(embedColor);
    
        const options = currentQuestion.options.map((option, i) =>
            new ButtonBuilder()
                .setCustomId(`option_${userId}_${i}`)
                .setLabel(option)
                .setStyle(ButtonStyle.Primary)
        );
    
        const nextButton = new ButtonBuilder()
            .setCustomId(`next_${userId}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Success);
    
        const endButton = new ButtonBuilder()
            .setCustomId(`end_${userId}`)
            .setLabel('End Quiz')
            .setStyle(ButtonStyle.Danger);
    
        const row = new ActionRowBuilder().addComponents(options);
        const actionRow = new ActionRowBuilder().addComponents(nextButton, endButton);
    
        await interaction.reply({ embeds: [embed], components: [row, actionRow] });
    }
    
    if (interaction.isButton()) {
        const [prefix, userId, optionIndexStr] = customId.split('_');
        const userState = userQuizState.get(userId);
    
        if (!userState) return;
    
        const currentQuestionIndex = userState.questionIndex;
    
        if (currentQuestionIndex >= quizQuestions.length) {
            await interaction.update({
                content: 'Quiz selesai!🥳🎉🍿 Terima kasih telah berpartisipasi!',
                embeds: [],
                components: []
            });
            userQuizState.delete(userId);
            return;
        }
    
        const currentQuestion = quizQuestions[currentQuestionIndex];
    
        if (prefix === 'option') {
            const selectedOption = currentQuestion.options[parseInt(optionIndexStr, 10)];
            const isCorrect = selectedOption === currentQuestion.answer;
    
            const response = isCorrect ? 
                `Correct!✅ The answer is **${currentQuestion.answer}**.` : 
                `Incorrect!❌ The correct answer was **${currentQuestion.answer}**.`;
    
            await interaction.update({
                content: response,
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`next_${userId}`)
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`end_${userId}`)
                                .setLabel('End Quiz')
                                .setStyle(ButtonStyle.Danger)
                        )
                ]
            });
    
            userState.questionIndex++;
        } else if (prefix === 'next') {
            await interaction.deferUpdate(); // Tunda update untuk memberikan waktu lebih
    
            if (userState.questionIndex < quizQuestions.length) {
                const nextQuestion = quizQuestions[userState.questionIndex];
    
                const colors = ['#0099ff', '#ff5733', '#33ff57', '#5733ff', '#ff33a8', '#33ffa5', '#ffa533', '#a533ff', '#33d4ff', '#ffb833'];
                const embedColor = colors[userState.questionIndex % colors.length];
    
                const embed = new EmbedBuilder()
                    .setTitle(`Question ${userState.questionIndex + 1}`)
                    .setDescription(nextQuestion.question)
                    .setColor(embedColor);
    
                const options = nextQuestion.options.map((option, i) =>
                    new ButtonBuilder()
                        .setCustomId(`option_${userId}_${i}`)
                        .setLabel(option)
                        .setStyle(ButtonStyle.Primary)
                );
    
                // Perbarui pesan dengan pertanyaan baru dan hapus pesan sebelumnya
                await interaction.editReply({
                    content: '', // Hapus keterangan "Correct!" atau "Incorrect!"
                    embeds: [embed],
                    components: [
                        new ActionRowBuilder().addComponents(options),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`next_${userId}`)
                                    .setLabel('Next')
                                    .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId(`end_${userId}`)
                                    .setLabel('End Quiz')
                                    .setStyle(ButtonStyle.Danger)
                            )
                    ]
                });
            } else {
                await interaction.editReply({
                    content: 'Quiz selesai!🥳🎉🍿 Terima kasih telah berpartisipasi!',
                    embeds: [],
                    components: [] // Hapus semua tombol
                });
                userQuizState.delete(userId);
            }
        } else if (prefix === 'end') {
            await interaction.update({
                content: 'Quiz telah berakhir. Terima kasih telah berpartisipasi!🍿🎥🎬',
                embeds: [],
                components: [] // Hapus semua tombol
            });
            userQuizState.delete(userId);
        }
    }
});


