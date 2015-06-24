var request = require('request');
var fs = require('fs');
var Entities = require('html-entities').AllHtmlEntities;
var html = new Entities();

function to_spaces (body) {
	var ret = body.split('\n').join(' ');
	while (ret.indexOf('  ') != -1) {
		ret = ret.split('  ').join(' ');
	}
	return ret;
};

function get_title (body) {
	return to_spaces(
		html.decode(
			body.split('<title>')[1].split('</title>')[0]
		)
	);
};

function get_short_description (body) {
	return to_spaces(
		html.decode(
			body.split('<meta name="description" content="')[1].split('"/>')[0]
		)
	);
};

function get_backers_count (body) {
	return parseInt(body.split('data-backers-count="')[1].split('"')[0]);
};

function get_goal_amount (body) {
	return parseFloat(body.split('data-goal="')[1].split('"')[0]);
};

function get_goal_percent (body) {
	return parseFloat(body.split('data-percent-raised="')[1].split('"')[0]);
};

function get_currency (body) {
	return body.split('data-currency="')[1].split('"')[0];
};

function get_duration (body) {
	return parseFloat(body.split('data-duration="')[1].split('"')[0]);
};

function get_end_date (body) {
	return body.split('data-end_time="')[1].split('"')[0];
};

function get_hours_remaining (body) {
	return parseFloat(body.split('data-hours-remaining="')[1].split('"')[0]);
};

function get_comment_name (body) {
	return body.split('href="/profile/')[1].split('>')[1].split('</a')[0];
};

function get_comment_profile_url (body) {
	return 'http://kickstarter.com/profile/' + body.split('href="/profile/')[1].split('"')[0];
};

function get_comment_url (body) {
	return 'http://kickstarter.com/projects/' + body.split('href="/projects/')[1].split('"')[0];
};

function get_comment_date (body) {
	return body.split('data-value="&quot;')[1].split('&quot;"')[0];
};

function get_comment_ago (body) {
	return body.split('"Comment[created_at]">')[1].split('</data>')[0];
};

function get_comment_text (body) {
	return body.split('<p>')[1].split('</p>')[0];
};

function get_comments (body) {
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
};


request.get('***REMOVED***?ref=category_featured', function (err, res, body) {
	var ret = {
		title: get_title(body),
		short_description: get_short_description(body),
		backers_count: get_backers_count(body),
		goal_amount: get_goal_amount(body),
		goal_percent: get_goal_percent(body),
		currency: get_currency(body),
		duration: get_duration(body),
		end_date: get_end_date(body),
		hours_remaining: get_hours_remaining(body),
	};
	fs.writeFileSync('main.txt', body, 'utf-8');
	request.get('***REMOVED***/comments', function (err, res, body) {
		ret.comments = get_comments(body);


		fs.writeFileSync('comments.txt', body, 'utf-8');
		console.log(JSON.stringify(ret, null, '  '));
	});
});