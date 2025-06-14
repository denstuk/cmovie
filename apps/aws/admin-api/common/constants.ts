// TODO: Review from security standpoint
export const DEFAULT_CORS_CONFIG: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type,Authorization",
	"Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

export const DEFAULT_VIEW_SIGNED_URL_EXPIRATION = 3600 * 1000 * 5; // 5 hours
export const DEFAULT_UPLOAD_SIGNED_URL_EXPIRATION = 3600; // 1 hour

export const COUNTRY_CODES: Record<string, string> = {
	"United States": "US",
	Canada: "CA",
	"United Kingdom": "GB",
	Australia: "AU",
	Germany: "DE",
	France: "FR",
	Japan: "JP",
	Brazil: "BR",
	India: "IN",
	China: "CN",
	"South Korea": "KR",
	Italy: "IT",
	Spain: "ES",
	Netherlands: "NL",
	Sweden: "SE",
	Norway: "NO",
	Finland: "FI",
	Denmark: "DK",
	Russia: "RU",
	Poland: "PL",
	Mexico: "MX",
	Argentina: "AR",
	"South Africa": "ZA",
	"New Zealand": "NZ",
	Switzerland: "CH",
	Belgium: "BE",
	Austria: "AT",
	Ireland: "IE",
	Portugal: "PT",
	Greece: "GR",
	"Czech Republic": "CZ",
	Hungary: "HU",
	Turkey: "TR",
};
