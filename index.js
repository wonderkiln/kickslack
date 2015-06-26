var port            = process.env.PORT || 80;
var express         = require('express');
var app             = express();
var request         = require('request');
var fs              = require('fs');
var Entities        = require('html-entities').AllHtmlEntities;
var html            = new Entities();
var Slack           = require('node-slack');
var slack           = new Slack(process.env.SLACK_WEBHOOK_URL || '***REMOVED***');
var track           = [];
var track_max       = 2;
var track_interval  = 1 * 60000;
var kickstarter_url = process.env.KICKSTARTER_URL || '***REMOVED***';

function to_spaces (body) {
	var ret = body.split('\n').join(' ');
	while (ret.indexOf('  ') != -1) {
		ret = ret.split('  ').join(' ');
	}
	return ret;
};

function get_title (body) {
	try {
		return to_spaces(
			html.decode(
				body.split('<title>')[1].split('</title>')[0]
			)
		);
	} catch (err) {
		return 'could not extract';
	}
};

function get_short_description (body) {
	try {
		return to_spaces(
			html.decode(
				body.split('<meta name="description" content="')[1].split('"/>')[0]
			)
		);
	} catch (err) {
		return 'could not extract';
	}
};

function get_backers_count (body) {
	try {	
		return parseInt(body.split('data-backers-count="')[1].split('"')[0]);
	} catch (err) {
		return 'could not extract';
	}
};

function get_goal_amount (body) {
	try {	
		return parseFloat(body.split('data-goal="')[1].split('"')[0]);
	} catch (err) {
		return 'could not extract';
	}
};

function get_goal_percent (body) {
	try {	
		return parseFloat(body.split('data-percent-raised="')[1].split('"')[0]);
	} catch (err) {
		return 'could not extract';
	}
};

function get_currency (body) {
	try {	
		return body.split('data-currency="')[1].split('"')[0];
	} catch (err) {
		return 'could not extract';
	}
};

function get_duration (body) {
	try {	
		return parseFloat(body.split('data-duration="')[1].split('"')[0]);
	} catch (err) {
		return 'could not extract';
	}
};

function get_end_date (body) {
	try {	
		return body.split('data-end_time="')[1].split('"')[0];
	} catch (err) {
		return 'could not extract';
	}
};

function get_hours_remaining (body) {
	try {	
		return parseFloat(body.split('data-hours-remaining="')[1].split('"')[0]);
	} catch (err) {
		return 'could not extract';
	}
};

function get_comment_name (body) {
	try {	
		return body.split('href="/profile/')[1].split('>')[1].split('</a')[0];
	} catch (err) {
		return 'could not extract';
	}
};

function get_comment_profile_url (body) {
	try {	
		return 'http://kickstarter.com/profile/' + body.split('href="/profile/')[1].split('"')[0];
	} catch (err) {
		return 'could not extract';
	}
};

function get_comment_url (body) {
	try {	
		return 'http://kickstarter.com/projects/' + body.split('href="/projects/')[1].split('"')[0];
	} catch (err) {
		return 'could not extract';
	}
};

function get_comment_date (body) {
	try {	
		return body.split('data-value="&quot;')[1].split('&quot;"')[0];
	} catch (err) {
		return 'could not extract';
	}
};

function get_comment_ago (body) {
	try {	
		return body.split('"Comment[created_at]">')[1].split('</data>')[0];
	} catch (err) {
		return 'could not extract';
	}
};

function get_comment_text (body) {
	try {	
		return to_spaces(
			html.decode(
				body.split('<p>')[1].split('</p>')[0]
			)
		);
	} catch (err) {
		return 'could not extract';
	}
};

function get_comments (body) {
	try {
		var ret = body.split('<div class="main clearfix pl2 ml2">');
		ret.splice(0, 1);
		fs.writeFileSync('ret.json', JSON.stringify(ret, null, '  '));
		for (var r = 0; r < ret.length; r++) {
			var body = ret[r];
			ret[r] = {
				name: get_comment_name(body),
				profile_url: get_comment_profile_url(body),
				comment_url: get_comment_url(body),
				date: get_comment_date(body),
				ago: get_comment_ago(body),
				text: get_comment_text(body),
			};
		}
		return ret;
	} catch (err) {
		return 'could not extract';
	}
};

function get_new_comments (previous, current) {
	if (previous == null) {
		return [];
	}
	var new_comments = [];
	for (var current_comment_idx = 0; current_comment_idx < current.comments.length; current_comment_idx++) {
		var found = false;
		for (var previous_comment_idx = 0; previous_comment_idx < previous.comments.length; previous_comment_idx++) {
			if (current.comments[current_comment_idx].comment_url == previous.comments[previous_comment_idx].comment_url) {
				found = true;
				break;
			}
		}
		if (!found) {
			new_comments.push(current.comments[current_comment_idx]);
		}
	}
	return new_comments;
};

function do_track () {
	request.get(kickstarter_url, function (err, res, body) {
		var ret = {
			title:             get_title(body),
			short_description: get_short_description(body),
			backers_count:     get_backers_count(body),
			goal_amount:       get_goal_amount(body),
			goal_percent:      get_goal_percent(body),
			currency:          get_currency(body),
			duration:          get_duration(body),
			end_date:          get_end_date(body),
			hours_remaining:   get_hours_remaining(body),
		};
		request.get(kickstarter_url + '/comments', function (err, res, body) {
			ret.comments = get_comments(body);
			track.push(ret);
			if (track.length > track_max) {
				track.shift();
			};
			if (track.length == 2) {
				track[0].comments.shift();
			}
			var new_comments = get_new_comments((track[track.length - 2] || null), ret);
			for (var new_comment_idx = 0; new_comment_idx < new_comments.length; new_comment_idx++) {
				var new_comment = new_comments[new_comment_idx];
				slack.send({
				    text:     '*' + new_comment.name + '*:\n' + new_comment.text + '\n\n_' + new_comment.ago + '_\n' + new_comment.comment_url,
				    username: 'Kickslack'
				});
			}
		});
	});
};

setInterval(do_track, track_interval);
do_track();

// Heroku requires binding to a port
app.get('/', function (req, res) {
    res.send('<3');
    res.end();
});
app.listen(port);
console.log('up!');