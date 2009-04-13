/*
 * Prototype history
 *
 * -----------------
 *
 * Based on jQuery history plugin
 * Copyright (c) 2006 Taku Sano (Mikage Sawatari), modified by Lincoln Cooper
 *
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 */

Object.extend(Prototype.Browser, {
  version: (function() {
    if ( Prototype.Browser.WebKit ) {
      var version = navigator.appVersion.match(/Version\/([\d.]{3}) /)[1];
      return parseFloat(version)
    }

    return 10
  })()
});

Prototype.History = Class.create({
	initialize: function(callback){
		this.historyCallback = callback;
		var current_hash = location.hash;
		
		this.historyCurrentHash = current_hash;
		if ((Prototype.Browser.IE) ) { // && (jQuery.browser.version < 8)
			// To stop the callback firing twice during initilization if no hash present
			if (this.historyCurrentHash == '') {
			this.historyCurrentHash = '#';
		}
		
			// add hidden iframe for IE
			$$("body").first().innerHTML += '<iframe id="proto_history" style="display: none;"></iframe>';
			var ihistory = $("proto_history");
			var iframe = ihistory.contentWindow.document;
			iframe.open();
			iframe.close();
			iframe.location.hash = current_hash;
		}
		else if (Prototype.Browser.WebKit && ( Prototype.Browser.version < 4 )) {
			// etablish back/forward stacks
			this.historyBackStack = [];
			this.historyBackStack.length = history.length;
			this.historyForwardStack = [];
			
			this.isFirst = true;
		}
		this.historyCallback(current_hash.replace(/^#/, ''));
		setInterval(this.historyCheck.bind(this), 100);
	},
	
	historyAddHistory: function(hash) {
		// This makes the looping function do something
		this.historyBackStack.push(hash);
		
		this.historyForwardStack.length = 0; // clear forwardStack (true click occured)
		this.isFirst = true;
	},
	
	historyCheck: function(){
		if ( Prototype.Browser.IE ) { // && (jQuery.browser.version < 8)
			// On IE, check for location.hash of iframe
			var ihistory = $("proto_history");
			var iframe = ihistory.contentDocument || ihistory.contentWindow.document;
			var current_hash = iframe.location.hash;
			if(current_hash != this.historyCurrentHash) {
			
				location.hash = current_hash;
				this.historyCurrentHash = current_hash;
				this.historyCallback(current_hash.replace(/^#/, ''));
				
			}
		} else if (Prototype.Browser.WebKit && ( Prototype.Browser.version < 4 )) {
			if (!this.dontCheck) {
				var historyDelta = history.length - this.historyBackStack.length;
				
				if (historyDelta) { // back or forward button has been pushed
					this.isFirst = false;
					if (historyDelta < 0) { // back button has been pushed
						// move items to forward stack
						for (var i = 0; i < Math.abs(historyDelta); i++) this.historyForwardStack.unshift(this.historyBackStack.pop());
					} else { // forward button has been pushed
						// move items to back stack
						for (var i = 0; i < historyDelta; i++) this.historyBackStack.push(this.historyForwardStack.shift());
					}
					var cachedHash = this.historyBackStack[this.historyBackStack.length - 1];
					if (cachedHash != undefined) {
						this.historyCurrentHash = location.hash;
						this.historyCallback(cachedHash);
					}
				} else if (this.historyBackStack[this.historyBackStack.length - 1] == undefined && !this.isFirst) {
					// back button has been pushed to beginning and URL already pointed to hash (e.g. a bookmark)
					// document.URL doesn't change in Safari
					if (document.URL.indexOf('#') >= 0) {
						this.historyCallback(document.URL.split('#')[1]);
					} else {
						var current_hash = location.hash;
						this.historyCallback('');
					}
					this.isFirst = true;
				}
			}
		} else {
			// otherwise, check for location.hash
			var current_hash = location.hash;
			if(current_hash != this.historyCurrentHash) {
				this.historyCurrentHash = current_hash;
				this.historyCallback(current_hash.replace(/^#/, ''));
			}
		}
	},
	historyLoad: function(hash){
		var newhash;
		
		if (Prototype.Browser.WebKit && ( Prototype.Browser.version < 4 )) {
			newhash = hash;
		}
		else {
			newhash = '#' + hash;
			location.hash = newhash;
		}
		this.historyCurrentHash = newhash;
		
		if ((Prototype.Browser.IE)) { // && (jQuery.browser.version < 8)
			var ihistory = $("jQuery_history");
			var iframe = ihistory.contentWindow.document;
			iframe.open();
			iframe.close();
			iframe.location.hash = newhash;
			this.historyCallback(hash);
		}
		else if (Prototype.Browser.WebKit && ( Prototype.Browser.version < 4 )) {
			this.dontCheck = true;
			// Manually keep track of the history values for Safari
			this.historyAddHistory(hash);
			
			// Wait a while before allowing checking so that Safari has time to update the "history" object
			// correctly (otherwise the check loop would detect a false change in hash).
			var fn = function() {this.dontCheck = false;};
			window.setTimeout(fn, 200);
			this.historyCallback(hash);
			// N.B. "location.hash=" must be the last line of code for Safari as execution stops afterwards.
			//      By explicitly using the "location.hash" command (instead of using a variable set to "location.hash") the
			//      URL in the browser and the "history" object are both updated correctly.
			location.hash = newhash;
		}
		else {
		  this.historyCallback(hash);
		}
	}
});


