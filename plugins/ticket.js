const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const dc = require('../libs/dc');
const e = require('cors');
module.exports = {
    //info
    name: 'ticket',
    enabled: true,
    //interctions
    slashCommands: true,
    contectMenues: false,
    buttons: true,
    selectMenues: false,
    modal: false,
    messages: true,
    //categorys
    database: false,
    logging: false,
    moderation: false,
    ephemeralresponse: true,
    setup: false,
    //SlashCommands Builder
    data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('bearbeite das Ticketsystem')
    .addSubcommand(subcommand => subcommand
            .setName('panel')
            .setDescription('erstelle ein neues Ticketpanel'))
    .addSubcommand(subcommand => subcommand
            .setName('close')
            .setDescription('schließt das Ticket im aktuellen Channel'))
    .addSubcommand(subcommand => subcommand
            .setName('status')
            .setDescription('ändere den Status des Tickets')
            .addStringOption(option => option
                .setName('type')
                .setDescription('typ der aktuellen Situation')
                .setRequired(true)
                .addChoices(
                        { name: 'wird bearbeitet', value: 'work' },
                        { name: 'warten auf Antwort', value: 'wait' },
                        { name: 'Hilfe benötigt', value: 'help' },
                        { name: 'Sonderfall', value: 'spec' },
                        { name: 'Neu', value: 'newt' },
                    )))
    
    ,
  async executeSlashCommand(interaction) {
    //permissons check
    if(!interaction.isChatInputCommand()) return;
    let button = null;
    let answer = 'keine passende Auswahl'
    switch (interaction.options.getSubcommand()) {
        case 'panel':
            answer = '⬇️⬇️⬇️';
            button = dc.createButton('https://localhost', 'neues Panel', ButtonStyle.Link);
            break;
    
        case 'close':
            //send close befehel
            answer = 'Ticket wird geschlossen, dies kann ein Moment dauern';
            button = dc.createButton(this.name + '.close.' + interaction.channelId, 'schließen', ButtonStyle.Danger);
            break;
    
        case 'status':
            //ticketchannel check
            let statuslong;
            const name = interaction.channel.name.slice(1);
            switch (interaction.options.getString('type')) {
                case 'work':
                    statuslong = 'wird bearbeitet';
                    interaction.channel.edit({ name: '🔧' + name });
                    break;
                case 'wait':
                    statuslong = 'warten auf User';
                    interaction.channel.edit({ name: '🕒' + name });
                    break;
                case 'help':
                    statuslong = 'Hilfe benötigt';
                    interaction.channel.edit({ name: '🚸' + name });
                    break;
                case 'spec':
                    statuslong = 'Sonderfall';
                    interaction.channel.edit({ name: '⭕' + name });
                    break;
                case 'newt':
                    statuslong = 'neues Ticket';
                    interaction.channel.edit({ name: '🆕' + name });
                    break;
                default:
                    break;
            }
            answer = 'Ticket Status wurde angepasst zu **' + statuslong + '** !'
            //api call update
            break;
        default:
            break;
    }
    let row = undefined;
    if(button !== null){
    row = new ActionRowBuilder()
			.addComponents(button);
    row = [row];
    }
    await interaction.reply({ embeds: [dc.sEmbed('Ticket', answer , 'Ticket System', '0xaaeeff')], components: row, ephemeral: true });
  },
  async executeMessage(message) {
    console.log(message.content);
    //db.saveMassageTicket(msg.content...)
  },
  async executeButton(button) {
    button.meta = button.customId.split('.');
    switch (button.meta[1]) {
        case 'newt':
            
            break;
        case 'close':
            //nachricht und channel unschreibbar
            //timer f löschen des chanels
            //..
            //srchiviert ticket
            break;
        default:
            break;
    }
    console.log(button.customId);
  }
};