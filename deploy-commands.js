const { REST, Routes } = require('discord.js');
require('dotenv').config();

const clientId = process.env.CLIENT_ID; // Replace with your bot's client ID
const guildId = process.env.GUILD_ID;   // Replace with your server's guild ID
const token = process.env.DISCORD_TOKEN;

const commands = [
    {
        name: 'film',
        description: 'Search for movie information',
        options: [
            {
                type: 3, // STRING type
                name: 'name',
                description: 'Name of the movie',
                required: true,
            },
        ],
    },
    {
        name: 'tv',
        description: 'Search for TV series information',
        options: [
            {
                type: 3, // STRING type
                name: 'name',
                description: 'Name of the TV series',
                required: true,
            },
        ],
    },
    {
        name: 'recommend',
        description: 'Get a random movie or TV series recommendation',
        options: [
            {
                type: 3, // STRING type
                name: 'type',
                description: 'Type of recommendation (movie or tv)',
                required: true, // Required to make the user choose
                choices: [
                    { name: 'Movie', value: 'movie' },
                    { name: 'TV Series', value: 'tv' },
                ],
            },
        ],
    },
    {
        name: 'hi',
        description: 'Greet the bot',
    },
    {
        name: 'funfact',
        description: 'Get a random fun fact about movies',
    },
    {
        name: 'quiz',
        description: 'Start a movie quiz',
    },
    {
        name: 'help',
        description: 'List all available bot commands',
    },
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started deleting existing commands.');

        // Delete all global commands (if you have any)
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log('Successfully deleted global commands.');

        // Delete all guild-specific commands
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
        console.log('Successfully deleted guild commands.');

        console.log('Started refreshing application (/) commands.');

        // Register new commands
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
