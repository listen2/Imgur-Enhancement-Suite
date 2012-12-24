// ==UserScript==
// @name 			imgur enhancement suite
// @namespace		imgur_listen2
// @description 	makes a few things a little better
// @include			http://imgur.com/*
// ==/UserScript==

(function(){
	function get_color(r) {
		//full green:	133, 191, 37
		//mid:			170, 170, 170
		//full red:		238, 68, 68
		x = Math.max(-100, Math.min(100, r)) / 100;		//confine x to (-1, 1)
		if (r > 0) {
			return "rgb(" + Math.floor(170-(x*37)) + ", " + Math.floor(170+(x*21)) + ", " + Math.floor(170-(x*133)) + ")";
		} else {
			return "rgb(" + Math.floor(170-(x*68)) + ", " + Math.floor(170+(x*102)) + ", " + Math.floor(170+(x*102)) + ")";
		}
	}

	function change_tag_text(e) {
		name = e.target.parentNode.parentNode.children[0].innerText;
		text = prompt("New tag for @" + name, e.target.innerText);
		e.target.innerText = text;
		user_tags[name] = text;
		localStorage["user_tags"] = JSON.stringify(user_tags);
	}

	function create_tagline(name) {
		tagline = document.createElement("span");
		r = vote_records[name] || 0;
		n = document.createElement("span");
		n.id = "voterecord_" + name;
		if (r) {		//don't show anything if record is zero
			n.innerHTML = "[" + r + "]";
			n.style.color = get_color(r);
		}
		tagline.appendChild(n);
		t = user_tags[name] || "tag";
		m = document.createElement("span");
		m.innerHTML = t;
		m.style.backgroundColor = "#222";
		m.style.border = "1px solid #555";
		m.style.paddingLeft = "2px";
		m.style.paddingRight = "2px";
		m.addEventListener("click", change_tag_text);
		tagline.appendChild(m);

		c = document.createTextNode(" ");
		tagline.insertBefore(c, tagline.firstChild);
		c = document.createElement("span");
		c.innerText = " :";
		tagline.appendChild(c);
		return tagline;
	}

	function tag_comment(t) {	//ugh this recursion
		for (var i = 0; i < t.children.length; i++) {
			if (t.children[i].tagName === "DIV" && t.children[i].className === "author") {
				user = t.children[i].children[0];
				tagline = create_tagline(user.innerText);
				user.parentNode.insertBefore(tagline, user.nextSibling);
				//attach arrow click handlers
				user.parentNode.parentNode.previousSibling.previousSibling.children[0].addEventListener("click", handle_upvote_comment) 
				user.parentNode.parentNode.previousSibling.previousSibling.children[0].username = user.innerText;	//for convenience
				user.parentNode.parentNode.previousSibling.previousSibling.children[1].addEventListener("click", handle_upvote_comment)
				user.parentNode.parentNode.previousSibling.previousSibling.children[1].username = user.innerText;	//for convenience
			} else {
				tag_comment(t.children[i]);
			}
		}
	}

	function tag_submitter(user) {
		var tagline = create_tagline(user.innerText);
		tagline.children[0].id = "submitter_vote_record";
		user.parentNode.insertBefore(tagline, user.nextSibling);
	}

	function handle_upvote_comment(e) {
		//TODO nope wrong. There are four possible state changes.
		name = e.target.parentNode.nextSibling.nextSibling.children[0].children[0].innerText;
		if (e.target.className.indexOf("pushed") !== -1)
			vote_records[name] = vote_records[name] ? vote_records[name]-1 : -1;
		else
			vote_records[name] = vote_records[name] ? vote_records[name]+1 : 1;
		countelement = document.getElementById("voterecord_" + name);
		countelement.innerText = "[" + vote_records[name] + "]";
		localStorage["vote_records"] = JSON.stringify(vote_records);
	}
	function handle_downvote_comment(e) {
		name = e.target.username;
		if (e.target.className.indexOf("pushed") !== -1)
			vote_records[name] = vote_records[name] ? vote_records[name]+1 : 1;
		else
			vote_records[name] = vote_records[name] ? vote_records[name]-1 : -1;
		countelement = document.getElementById("voterecord_" + name);
		countelement.innerText = "[" + vote_records[name] + "]";
		localStorage["vote_records"] = JSON.stringify(vote_records);
	}
	function handle_upvote_submission(e) {
		name = submitter_name.innerText;
		vote_records[name] = vote_records[name] ? vote_records[name]+1 : 1;
		document.getElementById("submitter_vote_record").innerText = "[" + vote_records[name] + "]";
		localStorage["vote_records"] = JSON.stringify(vote_records);
	}
	function handle_downvote_submission(e) {
	}
	function handle_upvote(e) {
	}
	function handle_downvote(e) {
	}

	//entry
	//load records from localStorage
	vote_records = JSON.parse(localStorage["vote_records"] || "{}");
	user_tags = JSON.parse(localStorage["user_tags"] || "{}");

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
				}
			}
		},
		false
	);

	//add tag to submitter's name
	subm = document.getElementById("stats-submit-source");
	if (subm && subm.children.length > 0) {
		tag_submitter(document.getElementById("stats-submit-source").children[1]);
		submitter_name = document.getElementsByClassName("url-truncated")[0];
		submitter_name.style.display = "inherit";
		submitter_name.style.width = "inherit";
	}

	//attach vote button handlers
	var arrows = document.getElementsByClassName("arrow");
	for (var i = 0; i < arrows.length; i++) {
		if (arrows[i].className.indexOf("up") !== -1)
			arrows[i].addEventListener("click", handle_upvote_submission);
		else
			arrows[i].addEventListener("click", handle_downvote_submission);
	}
})();
