var libQ = require('kew');
var libNet = require('net');
var libFast = require('fast.js');
var fs=require('fs-extra');
var exec = require('child_process').exec;
var Wireless = require('./lib/index.js');
var config= new (require('v-conf'))();

var connected = false;
var iface = 'wlan0';

var wireless = new Wireless({
	iface: iface,
	updateFrequency: 13,
	vanishThreshold: 7,
});

// Define the ControllerNetwork class
module.exports = ControllerNetwork;

function ControllerNetwork(context) {
	var self = this;

	// Save a reference to the parent commandRouter
	self.context=context;
	self.commandRouter = self.context.coreCommand;

}

ControllerNetwork.prototype.onVolumioStart = function() {
	var self = this;
	//Perform startup tasks here

	//getting configuration
	var configFile=self.commandRouter.pluginManager.getConfigurationFile(self.context,'config.json');
	config.loadFile(configFile);
}

ControllerNetwork.prototype.onStart = function() {
	var self = this;
	//Perform startup tasks here
}

ControllerNetwork.prototype.onStop = function() {
	var self = this;
	//Perform startup tasks here
}

ControllerNetwork.prototype.onRestart = function() {
	var self = this;
	//Perform startup tasks here
}

ControllerNetwork.prototype.onInstall = function()
{
	var self = this;
	//Perform your installation tasks here
}

ControllerNetwork.prototype.onUninstall = function()
{
	var self = this;
	//Perform your installation tasks here
}

ControllerNetwork.prototype.getConfigurationFiles = function()
{
	var self = this;

	return ['config.json'];
}

ControllerNetwork.prototype.getUIConfig = function()
{
	var self = this;

	var uiconf=fs.readJsonSync(__dirname+'/UIConfig.json');

	//dhcp
	uiconf.sections[0].content[0].value=config.get('dhcp');

	//static ip
	uiconf.sections[0].content[1].value=config.get('ethip');

	//static netmask
	uiconf.sections[0].content[2].value=config.get('ethnetmask');

	//static gateway
	uiconf.sections[0].content[3].value=config.get('ethgateway');

	//WLan ssid
	uiconf.sections[1].content[0].value=config.get('wlanssid');

	//
	uiconf.sections[1].content[1].value=config.get('wlanpass');

	return uiconf;
}

ControllerNetwork.prototype.setUIConfig = function(data)
{
	var self = this;

	var uiconf=fs.readJsonSync(__dirname+'/UIConfig.json');

}

ControllerNetwork.prototype.getConf = function(varName)
{
	var self = this;

	return self.config.get(varName);
}

ControllerNetwork.prototype.setConf = function(varName, varValue)
{
	var self = this;

	self.config.set(varName,varValue);
}

//Optional functions exposed for making development easier and more clear
ControllerNetwork.prototype.getSystemConf = function(pluginName,varName)
{
	var self = this;
	//Perform your installation tasks here
}

ControllerNetwork.prototype.setSystemConf = function(pluginName,varName)
{
	var self = this;
	//Perform your installation tasks here
}

ControllerNetwork.prototype.getAdditionalConf = function()
{
	var self = this;
	//Perform your installation tasks here
}

ControllerNetwork.prototype.setAdditionalConf = function()
{
	var self = this;
	//Perform your installation tasks here
}


var wireless = new Wireless({
	iface: iface,
	updateFrequency: 20,
	vanishThreshold: 7,
});

ControllerNetwork.prototype.scanWirelessNetworks = function(defer)
{
	var self = this;
	wireless.enable(function(error) {
		if (error) {
			console.log("[ FAILURE] Unable to enable wireless card. Quitting...");
			defer.reject(new Error("[ FAILURE] Unable to enable wireless card. Quitting..."));
			return;
		}
		console.log("[PROGRESS] Starting wireless scan...");

		wireless.start();
	});

	wireless.on('appear', function(network) {
		var quality = Math.floor(network.quality / 100 * 100);


		if (network.strength >= 65)
			signalStrength = 5;
		else if (network.strength >= 50)
			signalStrength = 4;
		else if (network.strength >= 40)
			signalStrength = 3;
		else if (network.strength >= 30)
			signalStrength = 2;
		else if (network.strength >= 20)
			signalStrength = 1;
		var ssid = network.ssid || undefined;

		var encryption_type = 'Open';
		if (network.encryption_wep) {
			encryption_type = 'WEP';
		} else if (network.encryption_wpa && network.encryption_wpa2) {
			encryption_type = 'WPA&WPA2';
		} else if (network.encryption_wpa) {
			encryption_type = 'WPA';
		} else if (network.encryption_wpa2) {
			encryption_type = 'WPA2';
		}


		if (ssid != undefined) {
			var self = this;
			var result = JSON.stringify({
				networs_ssid: ssid,
				signal: signalStrength,
				encryption: encryption_type
			});




		wireless.disable(function () {
			wireless.stop(
				print(result));

		});
		}
	});

	var deferDone=false;
	function print(networkarray) {
		if(deferDone==false)
		{
			defer.resolve(networkarray);
			deferDone=true;
		}
		self.pushWirelessNetworks(networkarray);

	}



}

ControllerNetwork.prototype.pushWirelessNetworks = function(scanresult) {
	var self = this;

	return self.commandRouter.volumiopushwirelessnetworks(scanresult);
}

ControllerNetwork.prototype.wirelessScan = function(scanresult) {
	var self = this;

	var defer = libQ.defer();
	self.scanWirelessNetworks(defer);
	return defer.promise;
}


ControllerNetwork.prototype.saveWiredNet=function(data)
{
	var self = this;

	var defer = libQ.defer();

	var dhcp=data['dhcp'];
	var static_ip=data['static_ip'];
	var static_netmask=data['static_netmask'];
	var static_gateway=data['static_gateway'];

	//	fs.copySync(__dirname + '/config.json', __dirname + '/config.json.orig');

	config.set('dhcp', dhcp);
	config.set('ethip', static_ip);
	config.set('ethnetmask', static_netmask);
	config.set('ethgateway', static_gateway);

	self.rebuildNetworkConfig();
	self.commandRouter.pushToastMessage('success',"Configuration update", 'The configuration has been successfully updated');


	defer.resolve({});
	return defer.promise;
}


ControllerNetwork.prototype.saveWirelessNet=function(data)
{
	var self = this;

	var defer = libQ.defer();

	var network_ssid=data['network_ssid'];
	var network_pass=data['network_pass'];

	config.set('wlanssid',network_ssid);
	config.set('wlanpass',network_pass);

	self.rebuildNetworkConfig();
	self.commandRouter.pushToastMessage('success',"Configuration update",'The configuration has been successfully updated');

	defer.resolve({});
	return defer.promise;
}

ControllerNetwork.prototype.getData = function(data,key)
{
	var self = this;

	for(var i in data)
	{
		var ithdata=data[i];

		if(ithdata[key]!=undefined)
			return ithdata[key];
	}

	return null;
}

ControllerNetwork.prototype.rebuildNetworkConfig = function()
{
	var self=this;

	try{
		var ws=fs.createOutputStream('/etc/network/interfaces');

		ws.cork();
		ws.write('auto lo\n');
		ws.write('iface lo inet loopback\n');
		ws.write('\n');

		ws.write('auto eth0\n');
		if(config.get('dhcp')==true || config.get('dhcp')=='true')
		{
			ws.write('iface eth0 inet dhcp\n');
		}
		else
		{
			ws.write('iface eth0 inet static\n');

			ws.write('address '+config.get('ethip')+'\n');
			ws.write('netmask '+config.get('ethnetmask')+'\n');
			ws.write('gateway '+config.get('ethgateway')+'\n');
		}

		ws.write('\n');

		ws.write('auto wlan0\n');
		ws.write('iface wlan0 inet dhcp\n');
		ws.write('wireless-power off\n');
		ws.write('wpa-ssid '+config.get('wlanssid')+'\n');
		ws.write('wpa-psk '+config.get('wlanpass')+'\n');

		ws.uncork();
		ws.end();

		console.log("Restarting networking layer");
		exec('sudo /bin/systemctl restart networking.service',
			function (error, stdout, stderr) {

				if (error !== null) {
					self.commandRouter.pushToastMessage('error',"Network restart",'Error while restarting network: '+error);
				}
				else self.commandRouter.pushToastMessage('success',"Network restart",'Network successfully restarted');

			});
	}
	catch(err)
	{
		self.commandRouter.pushToastMessage('error',"Network setup",'Error while setting network: '+err);
	}

}
