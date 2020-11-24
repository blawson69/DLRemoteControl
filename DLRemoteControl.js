/*
DLRemoteControl
Allows control of Roll20s Dynamic Lighting from the chat window

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l

Like this script? Become a patron:
    https://www.patreon.com/benscripts
*/

var DLRemoteControl = DLRemoteControl || (function () {
    'use strict';

    //---- INFO ----//

    var version = '0.2',
        debugMode = false,
        styles = {
            img: 'https://s3-us-west-1.amazonaws.com/roll20.images/power-icon-white.png',
            box:  'background-color: #fff; border: 2px solid #000; padding: 8px 16px; border-radius: 18px; margin-left: -35px; margin-right: 5px;',
            title: 'padding: 0 0 10px 0; font-size: 1.5em; font-weight: bold; font-variant: small-caps; color: ##591209;',
            sub: 'font-variant: small-caps;', on: 'background-color: #aa1616;', off: 'background-color: #545454;',
            bigButton: 'border: 2px solid #000; border-radius: 5px; padding: 0; margin-bottom: 6px;',
            smallButton: 'border: 2px solid #000; border-radius: 3px;padding: 4px; margin: 0 8px 2px 0;',
            wrapper: 'text-align: center; margin: 10px 0; clear: both;',
            textButton: 'background-color: transparent; border: none; padding: 2px 3px; margin: 2px; color: #591209; text-decoration: none;',
            accent: 'background-color: ##eaeaea;'
        },

    checkInstall = function () {
        if (!_.has(state, 'DLRemoteControl')) state['DLRemoteControl'] = state['DLRemoteControl'] || {};
        if (typeof state['DLRemoteControl'].presets == 'undefined') state['DLRemoteControl'].presets = [];
        log('--> DLRemoteControl v' + version + ' <-- Initialized');
		if (debugMode) {
            var d = new Date();
            sendChat('Debug Mode', '/w GM DLRemoteControl v' + version + ' loaded at ' + d.toLocaleTimeString(), null, {noarchive:true});
        }
    },


    //----- INPUT HANDLER -----//

    handleInput = function (msg) {
        if (msg.type == 'api' && msg.content.startsWith('!remote')) {
			var parms = msg.content.split(/\s+/i);
            if (playerIsGM(msg.playerid)) {
                if (parms[1]) {
                    switch (parms[1]) {
                        case '--set':
                        commandSet(msg);
                        break;
                        case '--save':
                        commandSave(msg);
                        break;
                        case '--delete':
                        commandDelete(msg.content);
                        break;
                        case '--rename':
                        commandRename(msg.content);
                        break;
                        default:
                        commandShow(msg);
                    }
                } else commandShow(msg);
            }
		}
    },

    commandShow = function (msg) {
		// Show "remote" in chat with current Dynamic Lighting settings
		var rText = '', page = getObj("page", getPageID(msg));
        var dLighting = page.get('showlighting'),
        upOnDrop = page.get('lightupdatedrop'),
        enforceLoS = page.get('lightenforcelos'),
        globIllum = page.get('lightglobalillum'),
        restrMove = page.get('lightrestrictmove');

        rText += '<div style=\'' + styles.wrapper + styles.sub + '\'>-=[ Dynamic Lighting Remote ]=-</div>';
        rText += '<div style=\'' + styles.wrapper + styles.title + '\'>&ldquo;' + page.get('name') + '&rdquo;</div><div style=\'' + styles.wrapper + '\'>';
        if (dLighting) rText += '<a style=\'' + styles.bigButton + styles.on + '\' href="!remote --set dl_off" title="Turn Dynamic Lighting Off">';
        else  rText += '<a style=\'' + styles.bigButton + styles.off + '\' href="!remote --set dl_on" title="Turn Dynamic Lighting On">';
        rText += '<img src="' + styles.img + '" width="34px" height="34px" /></a></div><table>';

        rText += '<tr><td>';
        if (enforceLoS) rText += '<a style=\'' + styles.on + styles.smallButton + '\' href="!remote --set ls_off" title="Turn Off">';
        else rText += '<a style=\'' + styles.off + styles.smallButton + '\' href="!remote --set ls_on" title="Turn On">';
        rText += '<img src="' + styles.img + '" width="20px" height="20px" /></a></td><td>Enforce Line of Sight</td></tr>';

        rText += '<tr><td>';
        if (upOnDrop) rText += '<a style=\'' + styles.on + styles.smallButton + '\' href="!remote --set ud_off" title="Turn Off">';
        else rText += '<a style=\'' + styles.off + styles.smallButton + '\' href="!remote --set ud_on" title="Turn On">';
        rText += '<img src="' + styles.img + '" width="20px" height="20px" /></a></td><td>Update on Drop</td></tr>';

        rText += '<tr><td>';
        if (restrMove) rText += '<a style=\'' + styles.on + styles.smallButton + '\' href="!remote --set rm_off" title="Turn Off">';
        else rText += '<a style=\'' + styles.off + styles.smallButton + '\' href="!remote --set rm_on" title="Turn On">';
        rText += '<img src="' + styles.img + '" width="20px" height="20px" /></a></td><td>Restrict Movement</td></tr>';

        rText += '<tr><td>';
        if (globIllum) rText += '<a style=\'' + styles.on + styles.smallButton + '\' href="!remote --set gi_off" title="Turn Off">';
        else rText += '<a style=\'' + styles.off + styles.smallButton + '\' href="!remote --set gi_on" title="Turn On">';
        rText += '<img src="' + styles.img + '" width="20px" height="20px" /></a></td><td>Global Illumination</td></tr>';

         rText += '</table><div style=\'' + styles.wrapper + '\'><a style=\'' + styles.textButton + '\' href="!remote --save ?&lbrace;Name&rbrace;">Save Settings as Preset</a></div>';

         if (_.size(state['DLRemoteControl'].presets) > 0) {
             rText += '<hr style="margin: 6px;"><div style=\'' + styles.wrapper + styles.sub + '\'>-=[ Presets ]=-</div><table>';
             let count = 1;
             _.each(state['DLRemoteControl'].presets, function (preset) {
                 if (count % 2 == 0) rText += '<tr>';
                 else rText += '<tr style=\'' + styles.accent + '\'>';
                 rText += '<td width="100%"><a style=\'' + styles.textButton + '\' href="!remote --set ' + preset.settings + '">&#9658; ' + preset.name + '</a></td>';
                 rText += '<td><a style=\'' + styles.textButton + ' font-size: 1.25em; margin-right: 8px;\' href="!remote --rename ?&lbrace;Name&rbrace;&verbar;' + preset.name + '" title="Rename Preset">↺</a></td>';
                 rText += '<td><a style=\'' + styles.textButton + ' font-size: 1.25em;\' href="!remote --delete ' + preset.name + '" title="Delete Preset">X</a></td></tr>';
                 count++;
             });
             rText += '</table><div style=\'' + styles.wrapper + styles.sub + '\'>-=-</div>';         }

        showRemote('', rText);
	},

    commandSet = function (msg) {
        // Set Dynamic Lighting according to given variables
        var parms = msg.content.replace(/\!remote\s+\-\-set\s+/g, '').split(','),
        page = getObj("page", getPageID(msg));

        if (parms) {
            _.each(parms, function (parm) {
                parm = parm.toLowerCase().trim();
                if (parm.startsWith('dl')) page.set({showlighting: (parm == 'dl_on' ? true : false)});
                if (parm.startsWith('ud')) page.set({lightupdatedrop: (parm == 'ud_on' ? true : false)});
                if (parm.startsWith('ls')) page.set({lightenforcelos: (parm == 'ls_on' ? true : false)});
                if (parm.startsWith('gi')) page.set({lightglobalillum: (parm == 'gi_on' ? true : false)});
                if (parm.startsWith('rm')) page.set({lightrestrictmove: (parm == 'rm_on' ? true : false)});
            });
            commandShow(msg);
        } else {
            sendChat('DLRemoteControl', '/w GM ERROR: no parameters given to set.', null, {noarchive:true});
        }
    },

    commandSave = function (msg) {
        // Save current Dynamic Lighting settings as a preset
        var name = msg.content.replace(/\!remote\s+\-\-save/g, '').trim();
        if (name.length > 0) {
            var settings = [], preset = {name: name, settings: []}, page = getObj("page", getPageID(msg));
            var dLighting = (page.get('showlighting')) ? 'dl_on' : 'dl_off',
            upOnDrop = (page.get('lightupdatedrop')) ? 'ud_on' : 'ud_off',
            enforceLoS = (page.get('lightenforcelos')) ? 'ls_on' : 'ls_off',
            globIllum = (page.get('lightglobalillum')) ? 'gi_on' : 'gi_off',
            restrMove = (page.get('lightrestrictmove')) ? 'rm_on' : 'rm_off';
            settings.push(dLighting);
            settings.push(upOnDrop);
            settings.push(enforceLoS);
            settings.push(globIllum);
            settings.push(restrMove);
            preset.settings = settings.join(',');
            state['DLRemoteControl'].presets.push(preset);
        } else {
            sendChat('DLRemoteControl', '/w GM ERROR: no parameters given to save.', null, {noarchive:true});
        }

        commandShow(msg);
    },

    commandDelete = function(msg) {
        // Deletes a preset
        var name = msg.replace(/\!remote\s+\-\-delete/g, '').trim();
        log('name to delete = ' + name);
        if (name.length > 0) {
            state['DLRemoteControl'].presets = _.reject(state['DLRemoteControl'].presets, function(preset) { return preset.name == name; });
        } else {
            sendChat('DLRemoteControl', '/w GM ERROR: no parameters given to delete.', null, {noarchive:true});
        }
        commandShow(msg);
    },

    commandRename = function (msg) {
        // Renames a preset
        var names = msg.replace(/\!remote\s+\-\-rename/g, '').trim().split('|');
        if (names && _.size(names) == 2 && names[0].length > 0 && names[1].length > 0) {
            var preset = _.find(state['DLRemoteControl'].presets, function (tmp) { return tmp.name == names[1]; });
            if (preset) {
                preset.name = names[0];
            } else {
                sendChat('DLRemoteControl', '/w GM ERROR: No preset named \'' + names[1] + '\' found.', null, {noarchive:true});
            }
        } else {
            sendChat('DLRemoteControl', '/w GM ERROR: not enough parameters given to rename.', null, {noarchive:true});
        }
        commandShow(msg);
    },

	showRemote = function (title, content) {
        title = (title == '') ? '' : '<div style=\'' + styles.title + '\'>' + title + '</div>';
        var body = '<div style=\'' + styles.box + '\'>' + title + '<div>' + content + '</div></div>';
        sendChat('DLRemoteControl','/w GM ' + body, null, {noarchive:true});
	},

    getPageID = function (msg) {
        // Returns the pageID of the working page
        var pageID = Campaign().get("playerpageid");
        if (msg.selected) {
            var token = getObj(msg.selected[0]._type, msg.selected[0]._id);
            if (token) pageID = token.get('pageid');
        }
        return pageID;
    },

    //---- PUBLIC FUNCTIONS ----//

    registerEventHandlers = function () {
		on('chat:message', handleInput);
	};

    return {
		checkInstall: checkInstall,
		registerEventHandlers: registerEventHandlers
	};
}());

on("ready", function () {
    DLRemoteControl.checkInstall();
    DLRemoteControl.registerEventHandlers();
});
