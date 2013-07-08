// ==UserScript==
// @name 			Imgur Enhancement Suite
// @namespace		imgur_listen2
// @downloadURL	https://raw.github.com/listen2/Imgur-Enhancement-Suite/master/imgur_enhancement_suite.user.js
// @version			2.1.2
// @description 	Makes a few things a little bit better.
// @include			http://imgur.com/gallery/*
// @include			http://imgur.com/user/*
// ==/UserScript==

/*	Copyright 2012-2013 listen2

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

(function(){
	var version = "2.1.2";

	function check_version() {
		version_info = JSON.parse(localStorage["version_info"] || "{}");
		t = new Date().getTime();
		if (t - version_info.last_check < 86400) //24 hours
			return;
		req = new XMLHttpRequest();	
		req.onreadystatechange = received_version;
		req.open("GET", "http://imgur.com/user/imgurenhancementsuite", true);
		req.send(null);
	}
	function received_version() {
		if (req.readyState === 4) {
			if (req.status === 200) {
				version_info.last_version = req.responseText.match(/account-bio" class="textbox profile ">[^]*?version=(\d\.\d\.\d)[^]*?<\/div>/)[1];
				var t = new Date().getTime();
				version_info.last_check = t;
				localStorage["version_info"] = JSON.stringify(version_info);
				show_updates_available(version_info);
			} else {
				show_updates_available(null);
			}
		}
	}
	function show_updates_available(info) {
		if (info === null) {
			document.getElementById("update_span").textContent = "Update check error";
			floating_control.children[0].style.color = "#e44";
			floating_control.children[0].style.fontWeight = "bold";
		} else {
			a = version.split(".");
			b = info.last_version.split(".");
			if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) {
				document.getElementById("update_span").innerHTML = "<a href='https://github.com/listen2/Imgur-Enhancement-Suite'>New version: " + info.last_version + "</a>";
				floating_control.children[0].style.color = "#85BF25";
				floating_control.children[0].style.fontWeight = "bold";
			} else {
				document.getElementById("update_span").textContent = "Up to date";
			}
		}
	}

	function get_color(r) {
		//full green:	133, 191, 37
		//mid:			170, 170, 170
		//full red:		238, 68, 68
		x = Math.max(-25, Math.min(25, r)) / 25;		//confine x to (-1, 1)
		if (r > 0) {
			return "rgb(" + Math.floor(170-(x*37)) + ", " + Math.floor(170+(x*21)) + ", " + Math.floor(170-(x*133)) + ")";
		} else {
			return "rgb(" + Math.floor(170-(x*68)) + ", " + Math.floor(170+(x*102)) + ", " + Math.floor(170+(x*102)) + ")";
		}
	}

	function change_tag_text(e) {
		name = e.target.username;
		text = prompt("New tag for @" + name, e.target.textContent);
		if (text === null)
			return;
		tags = document.getElementsByName("usertag_" + name);
		for (var i = 0; i < tags.length; i++) {
			if (tags[i].tagName === "IMG") {
				m = create_tag_span(name, text);
				new_span = tags[i].parentNode.insertBefore(m, tags[i]);
				tags[i].parentNode.removeChild(new_span.nextSibling);
			}
			tags[i].textContent = text;
		}
		user_tags[name] = text;
		localStorage["user_tags"] = JSON.stringify(user_tags);
	}

	function create_tag_span(name, t) {
		m = document.createElement("span");
		m.innerHTML = t;
		m.username = name;
		m.setAttribute("name", "usertag_" + name);
		m.style.backgroundColor = "#222";
		m.style.border = "1px solid #555";
		m.style.paddingLeft = "2px";
		m.style.paddingRight = "2px";
		m.addEventListener("click", change_tag_text);
		return m;
	}

	function create_tagline(name) {
		tagline = document.createElement("span");
		tagline.className = "ies_tagline";
		r = vote_records[name] || 0;
		n = document.createElement("span");
		n.setAttribute("name", "voterecord_" + name);
		if (r) {		//don't show anything if record is zero
			n.innerHTML = "[" + r + "]";
			n.style.color = get_color(r);
		}
		tagline.appendChild(n);
		if (user_tags[name]) {
			t = user_tags[name] || "&nbsp;&nbsp;";
			m = create_tag_span(name, t);
			tagline.appendChild(m);
		} else {
			m = document.createElement("img");
			m.username = name;
			m.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAICAYAAADwdn+XAAAABmJLR0QAiQDGACTslGe/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QMdFhcB7Yg7AQAAAIlJREFUKM+d0SEKAmEQBtA364JNsGwz6Q0UBINX8B5ewDMYBcMGg91utXkKo8kjCPpbVli2rOuDaTPfMEyklHxFxBhrFHhpd8lrw3PsMfO7Zx4RGVbYYaSbd44lTujB9joBm8VN/bymiAAZHjj7V7WlwBGpY5VSSt+QIcqOAYdovHGAKfpVQ5v7B/dPOZblyjmxAAAAAElFTkSuQmCC");
			m.setAttribute("name", "usertag_" + name);
			m.addEventListener("click", change_tag_text);
			tagline.appendChild(m);
		}

		c = document.createTextNode(" ");
		tagline.insertBefore(c, tagline.firstChild);
		c = document.createElement("span");
		c.textContent = " :";
		tagline.appendChild(c);
		if (config_tag_self && name === account_name) { // add "self" element
			c = document.createElement("span");
			c.textContent = "self";
			c.className = "self";
			tagline.appendChild(c);
		}
		return tagline;
	}

	function tag_comment(t) {	//ugh this recursion
		for (var i = 0; i < t.children.length; i++) {
			if (t.children[i].tagName === "DIV" && t.children[i].className === "author") {
				user = t.children[i].children[0];
				tagline = create_tagline(user.textContent);
				user.parentNode.insertBefore(tagline, user.nextSibling);
				//attach arrow click handlers
				user.parentNode.parentNode.previousSibling.children[0].addEventListener("click", handle_upvote_comment) 
				user.parentNode.parentNode.previousSibling.children[0].username = user.textContent;	//for convenience
				user.parentNode.parentNode.previousSibling.children[1].addEventListener("click", handle_downvote_comment)
				user.parentNode.parentNode.previousSibling.children[1].username = user.textContent;	//for convenience
			} else {
				tag_comment(t.children[i]);
			}
		}
	}

	function tag_submitter(user) {
		if (user.nextSibling && user.nextSibling.className === "ies_tagline")
			return false;
		var tagline = create_tagline(user.textContent);
		tagline.children[0].id = "voterecord_" + user.textContent;
		user.parentNode.insertBefore(tagline, user.nextSibling);
		return true;
	}

	function update_vote_records(name) {
		counts = document.getElementsByName("voterecord_" + name);
		for (var i = 0; i < counts.length; i++) {
			counts[i].textContent = "[" + vote_records[name] + "]";
		}
	}

	function handle_vote(name, up, down, upvote) {
		up_pushed = button_is_pushed(up);
		down_pushed = button_is_pushed(down);
		if (upvote === true) {
			if (up_pushed === true) {    //un-upvote
				vote_records[name] = vote_records[name] ? vote_records[name]-1 : -1;
			} else if (down_pushed) {    //change downvote to upvote
				vote_records[name] = vote_records[name] ? vote_records[name]+2 : 1;
			} else {              //normal upvote
				vote_records[name] = vote_records[name] ? vote_records[name]+1 : 1;
			}
		} else {
			if (down_pushed === true) {    //un-downvote
				vote_records[name] = vote_records[name] ? vote_records[name]+1 : 1;
			} else if (up_pushed) {      //change upvote to downvote
				vote_records[name] = vote_records[name] ? vote_records[name]-2 : -1;
			} else {              //normal downvote
				vote_records[name] = vote_records[name] ? vote_records[name]-1 : -1;
			}
		}
		update_vote_records(name);
		localStorage["vote_records"] = JSON.stringify(vote_records);
	}

	function handle_upvote_comment(e) {
		up = e.target;
		down = e.target.parentNode.children[1];
		handle_vote(e.target.username, up, down, true);
	}
	function handle_downvote_comment(e) {
		up = e.target.parentNode.children[0];
		down = e.target;
		handle_vote(e.target.username, up, down, false);
	}
	function handle_upvote_submission(e) {
		name = document.getElementsByClassName("url-truncated")[0].textContent;
		up = e.target;
		down = e.target.parentNode.children[1];
		handle_vote(name, up, down, true);
	}
	function handle_downvote_submission(e) {
		name = document.getElementsByClassName("url-truncated")[0].textContent;
		up = e.target.parentNode.children[0];
		down = e.target;
		handle_vote(name, up, down, false);
	}

	function fade_to(o, end, step) {
		if ((end > 0 && o.style.opacity >= end) || (end == 0 && o.style.opacity <= end))
			return;
		o.style.opacity = parseFloat(o.style.opacity) + step;
		window.setTimeout(function() { fade_to(o, end, step) }, 10);
	}
	function set_up_title_faders() {
		if (window.fade_timer !== undefined)
			clearTimeout(fade_timer);
		te = document.getElementById("image-title");
		te.style.opacity = 0;
		//add_css("#image-title{opacity:0}");
		window.fade_timer = window.setTimeout(function(e) { fade_to(te, 1, 0.1) }, config_hide_time.value);
		te.addEventListener("mouseover", function(e) { fade_to(te, 1, 0.1) }, false);
	}

	function button_is_pushed(b) {
		return b.className.indexOf("pushed") !== -1;
	}

	function floating_control_expand() {
		floating_control.style.height = "auto";
	}
	function floating_control_collapse() {
		floating_control.style.height = "1em";
	}

	//entry
	//load records from localStorage
	vote_records = JSON.parse(localStorage["vote_records"] || "{}");
	user_tags = JSON.parse(localStorage["user_tags"] || "{}");

	//set default config
	if (localStorage["config_hide"] === undefined) localStorage["config_hide"] = true;
	if (localStorage["config_tag_op"] === undefined) localStorage["config_tag_op"] = true;
	if (localStorage["config_tag_self"] === undefined) localStorage["config_tag_self"] = true;
	//create IES control panels
	var floating_control = document.createElement("div");
	floating_control.style.position = "fixed";
	floating_control.style.left = "0";
	floating_control.style.top = "0";
	floating_control.style.overflow = "hidden";
	floating_control.style.height = "1em";
	//floating_control.innerHTML = "IES";
	floating_control.innerHTML = "<span>IES</span><br><input id='config_hide' type='checkbox'/>Hide titles for <input id='config_hide_time' type='text' pattern='\d' style='width:44px;margin:0;padding:0'/>msec<br><input id='config_tag_op' type='checkbox'/>Label OPs<br><input id='config_tag_self' type='checkbox'/>Label own posts<br><span id='update_span'></span>";
	floating_control.addEventListener("mouseover", function() {floating_control_expand()});
	floating_control.addEventListener("mouseout", function() {floating_control_collapse()});
	document.body.appendChild(floating_control);
	config_hide = document.getElementById("config_hide");
	config_hide.checked = (localStorage["config_hide"] === "true");
	config_hide.addEventListener("change", function(e) { localStorage["config_hide"] = config_hide.checked; }, false);
	config_hide_time = document.getElementById("config_hide_time");
	config_hide_time.value = localStorage["config_hide_time"] || "1000";
	config_hide_time.addEventListener("change", function(e) { localStorage["config_hide_time"] = config_hide_time.value; }, false);
	config_tag_op = document.getElementById("config_tag_op");
	config_tag_op.checked = Boolean(localStorage["config_tag_op"] === "true");
	config_tag_op.addEventListener("change", function(e) { localStorage["config_tag_op"] = config_tag_op.checked; }, false);
	config_tag_self = document.getElementById("config_tag_self");
	config_tag_self.checked = Boolean(localStorage["config_tag_self"] === "true");
	config_tag_self.addEventListener("change", function(e) { localStorage["config_tag_self"] = config_tag_self.checked; }, false);
	/*var control_panel = document.createElement("div");
	control_panel.innerHTML = "ggg";
	document.getElementById("right-content").appendChild(control_panel);*/

	var account_arrow = document.getElementsByClassName("account-arrow")[0];
	if (account_arrow === undefined) {	//mobile
		var x = document.getElementsByTagName("a");
		for (var i = 0; i < x.length; i++) {
			if (x[i].href === "http://imgur.com/account/settings/") {
				var account_name = x[i].textContent;
				break;
			}
		}
	} else {
		var account_name = account_arrow.nextSibling.textContent;
	}

	if (location.href.match(/https?:\/\/imgur.com\/\/?gallery\/.*/)) {
		//add tag to each comment as it is loaded
		document.body.addEventListener("DOMNodeInserted", function (e) {
				if (e.target.tagName === "DIV") {
					if (e.target.className === "comment") {
						tag_comment(e.target);
					/*} else if (e.target.className === "stats-submit-source") {
						tag_submitter(e.target.children[1]);
						submitter_name = e.target.children[1];
						submitter_name.style.display = "inherit";
						submitter_name.style.width = "inherit";*/
					} else if (e.target.className.indexOf("title") !== -1 && e.target.className.indexOf("positive") !== -1) {
						//it's non-intuitive, but I think this is the most efficient reliable way to detect that we've changed images.
						//add tag to submitter's name
						subm = document.getElementById("stats-submit-source");
						if (subm && subm.children.length > 0) {
							if (tag_submitter(document.getElementById("stats-submit-source").children[1])) {
								submitter_name = document.getElementsByClassName("url-truncated")[0];
								submitter_name.style.display = "inherit";
								submitter_name.style.width = "inherit";
							}
						}
						//hide title
						if (config_hide.checked) {
							set_up_title_faders();
						}
					}//image change
				}
			},
			false
		);

		//attach vote button handlers
		var arrows = document.getElementsByClassName("arrow");
		for (var i = 0; i < arrows.length; i++) {
			if (arrows[i].className.indexOf("up") !== -1)
				arrows[i].addEventListener("click", handle_upvote_submission);
			else
				arrows[i].addEventListener("click", handle_downvote_submission);
		}
		//hide title
		if (config_hide.checked) {
			set_up_title_faders();
		}
	} else if (location.href.match(/https?:\/\/imgur.com\/user\/.*/)) {
		caps = document.getElementsByClassName("caption");
		for (var i = 0; i < caps.length; i++) {
			tag_comment(caps[i]);
		}
		document.body.addEventListener("DOMNodeInserted", function (e) {
				if (e.target.tagName === "DIV") {
					if (e.target.className === "comment-item") {
						tag_comment(e.target);
					}
				}
			},
			false
		);
	}

	function add_css(s) {
		var e = document.createElement("style");
		e.type = "text/css";
		e.innerHTML = s
		var head = document.getElementsByTagName("head")[0].appendChild(e);
	}

	if (config_tag_op.checked) {	//make "OP" more visible
		add_css(".author .green{background:#85BF25;color:#181817!important;border-radius:3px;padding-right:3px}");
	}
	if (config_tag_self.checked) {	//add tag to own comments
		add_css(".author .self{background:orange;color:#181817!important;border-radius:3px;padding-right:3px;padding-left:2px;margin-left:3px}");
	}
	check_version();
})();
