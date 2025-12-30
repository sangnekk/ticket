const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { clientId, token } = require('./config.json');

// Initialize arrays for different command types
const commands = [];
const prefixCommands = {};

// Biến để kiểm soát
let isDeploying = false;

// Function to load commands from a specific type (slash or prefix)
function loadCommands(commandType) {
  const commandPath = path.join(__dirname, 'commands', commandType);

  // Check if directory exists first
  if (!fs.existsSync(commandPath)) {
    console.log(`Directory not found: ${commandPath}`);
    return;
  }

  // Clear existing commands before loading
  if (commandType === 'slash') {
    commands.length = 0; // Clear slash commands array
  } else if (commandType === 'prefix') {
    Object.keys(prefixCommands).forEach(key => delete prefixCommands[key]); // Clear prefix commands object
  }

  const loadedCommands = new Set(); // Track loaded command names

  const subfolders = fs.readdirSync(commandPath);

  // Process each subfolder in the commands directory
  for (const subfolder of subfolders) {
    const subfolderPath = path.join(commandPath, subfolder);

    // Check if it's actually a directory
    if (fs.statSync(subfolderPath).isDirectory()) {
      const commandFiles = fs.readdirSync(subfolderPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(subfolderPath, file);

        // Clear require cache to ensure fresh load
        delete require.cache[require.resolve(filePath)];

        try {
          const command = require(filePath);

          if (commandType === 'slash') {
            if ('data' in command && 'execute' in command) {
              const commandName = command.data.name;
              if (loadedCommands.has(commandName)) {
                console.log(
                  `⚠️ Skipping duplicate command: ${commandName} in ${subfolder}/${file}`
                );
                continue;
              }
              commands.push(command.data.toJSON());
              loadedCommands.add(commandName);
              console.log(`✓ Loaded slash command: ${commandName} from ${subfolder}/${file}`);
            } else {
              console.log(
                `✗ [WARNING] The slash command at ${filePath} is missing a required "data" or "execute" property.`
              );
            }
          } else if (commandType === 'prefix') {
            if ('name' in command && 'execute' in command) {
              if (loadedCommands.has(command.name)) {
                console.log(
                  `⚠️ Skipping duplicate command: ${command.name} in ${subfolder}/${file}`
                );
                continue;
              }
              prefixCommands[command.name] = command;
              loadedCommands.add(command.name);
              console.log(`✓ Loaded prefix command: ${command.name} from ${subfolder}/${file}`);
            } else {
              console.log(
                `✗ [WARNING] The prefix command at ${filePath} is missing a required "name" or "execute" property.`
              );
            }
          }
        } catch (error) {
          console.error(`Error loading command from ${filePath}:`, error);
        }
      }
    }
  }
}

// Create REST instance
const rest = new REST({ version: '10' }).setToken(token);

// Main deployment function for GLOBAL commands only
async function deployGlobalCommands() {
  // Nếu đang deploy thì bỏ qua
  if (isDeploying) {
    console.log('Deployment already in progress, skipping...');
    return;
  }

  try {
    isDeploying = true;
    console.log('Loading commands...');
    loadCommands('slash');
    loadCommands('prefix');

    if (commands.length === 0) {
      console.log('No slash commands found to deploy!');
      return;
    }

    console.log('Global commands to be deployed:');
    const commandNames = new Set();
    const duplicateNames = new Set();

    commands.forEach(cmd => {
      if (commandNames.has(cmd.name)) {
        duplicateNames.add(cmd.name);
        console.log(`⚠️ Duplicate command name found: ${cmd.name}`);
      }
      commandNames.add(cmd.name);
      console.log(`- ${cmd.name}`);
    });

    if (duplicateNames.size > 0) {
      console.error('❌ Duplicate command names detected:', Array.from(duplicateNames));
      return;
    }

    console.log(`Started refreshing ${commands.length} application (/) commands GLOBALLY.`);

    // Deploy globally
    const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
    console.log(`Loaded ${Object.keys(prefixCommands).length} prefix commands`);

    console.log('\nRegistered Global Slash Commands:');
    commands.forEach(cmd => console.log(`- /${cmd.name}`));

    console.log('\nLưu ý: Lệnh global có thể mất tối đa 1 giờ để hiển thị ở tất cả server.');
  } finally {
    isDeploying = false;
  }
}

// List existing global commands
async function listExistingGlobalCommands() {
  try {
    const commands = await rest.get(Routes.applicationCommands(clientId));
    console.log('\nExisting global commands:');
    commands.forEach(cmd => console.log(`- ${cmd.name} (ID: ${cmd.id})`));
  } catch (error) {
    console.error('Error listing commands:', error);
  }
}

// Thực hiện deploy global commands
console.log('=== DEPLOYING COMMANDS GLOBALLY ===');
console.log('Lưu ý: Lệnh global có thể mất tối đa 1 giờ để hiển thị ở tất cả server.');
deployGlobalCommands().then(() => {
  listExistingGlobalCommands();
});
