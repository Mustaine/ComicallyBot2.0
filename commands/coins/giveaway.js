const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { awaitReaction } = require("../../functions.js");

const coins = require('../../schemas/coins.js');

module.exports = {
    name: "giveaway",
    aliases: ["coinsgiveaway"],
    category: "coins",
    description: "Giveaway for coins",
    permissions: "moderator",
    usage: "<amount> <time>",
    run: async (client, message, args) => {
        const logChannel = message.guild.channels.find(c => c.name === "mods-log") || message.channel;
        if (message.deletable) message.delete();
        let guildID = message.guild.id;

        if (!args[0])
            return message.reply("Please provide an amount of coins.").then(m => m.delete(7500));

        if (!args[1])
            return message.reply("Please provide an amount of time.").then(m => m.delete(7500));

        if (isNaN(args[0]))
            return message.reply("Please provide a valid number of coins").then(m => m.delete(7500));

        if (isNaN(args[1]))
            return message.reply("Please provide a valid number for time.").then(m => m.delete(7500));

        let amount = Math.floor(args[0]);
        let time = Math.floor(args[1] * 60000);

        if (amount < 1 || time < 1)
            return message.reply("Please provide numbers greater than or equal to 1.").then(m => m.delete(7500));

        let embed = new RichEmbed()
            .setTitle("**React below for the giveaway!**")
            .setDescription(`The giveaway is for ${amount} coins, and is going for ${Math.floor(args[1])} minute(s)`)
            .setFooter(`${amount} coins for ${Math.floor(args[1])} minute(s)`)
            .setTimestamp();

        message.channel.send(embed).then(async msg => {
            const users = await awaitReaction(msg, time, "💯");

            if (users.length > 0) {
                const random = Math.floor(Math.random() * users.length);
                let userID = users[random].id;
                let userName = users[random].username;

                msg.clearReactions();

                embed
                    .setDescription(`Congrats <@${userID}>, you are the winner of the ${amount} coins giveaway!`)
                    .setFooter(`${userName} won ${amount} coins!`);

                coins.findOne({ guildID: guildID, userID: userID }, (err, exists) => {
                    if (!exists) {
                        const newCoins = new coins({
                            _id: mongoose.Types.ObjectId(),
                            guildID: guildID, guildName: guildName,
                            userID: userID, userName: "USERNAME PLACEHOLDER", coins: amount
                        });
                        newCoins.save().catch(err => console.log(err));
                    } else {
                        exists.coins += amount;
                        exists.save().catch(err => console.log(err));

                        const logEmbed = new RichEmbed()
                            .setColor("#0efefe")
                            .setThumbnail(message.member.displayAvatarURL)
                            .setFooter(message.member.displayName, message.author.displayAvatarURL)
                            .setTimestamp()
                            .setDescription(stripIndents`
                                **> Coins Giveaway by:** <@${message.member.id}> ${message.member.user.username} (${message.member.id})
                                **> Coins Giveaway won by:** <@${userID}> ${userName} (${userID})
                                **> Coins Given:** ${amount}`);

                        logChannel.send(logEmbed);
                    }
                }).catch(err => console.log(err));

                msg.edit(embed);

            } else {
                msg.clearReactions();

                embed
                    .setDescription(`There were no winners awarded, not enough reactions!`)
                    .setFooter(`No one won the ${amount} coins!`);

                msg.edit(embed);
            }
        });
    }
}