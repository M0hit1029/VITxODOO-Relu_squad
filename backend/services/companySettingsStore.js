const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', 'config', 'company-settings.json');

const defaults = {
	notifications: {
		submission: true,
		approval: true,
		rejection: true,
	},
	security: {
		minLength: 8,
		requireMfa: false,
	},
	logoUrl: '',
};

const ensureSettingsFile = () => {
	fs.mkdirSync(path.dirname(settingsPath), { recursive: true });

	if (!fs.existsSync(settingsPath)) {
		fs.writeFileSync(settingsPath, '{}', 'utf8');
	}
};

const readSettingsStore = () => {
	ensureSettingsFile();

	try {
		return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
	} catch {
		return {};
	}
};

const writeSettingsStore = (store) => {
	ensureSettingsFile();
	fs.writeFileSync(settingsPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
};

const getCompanySettings = (companyId) => {
	const store = readSettingsStore();
	const saved = store[companyId] || {};

	return {
		notifications: {
			...defaults.notifications,
			...(saved.notifications || {}),
		},
		security: {
			...defaults.security,
			...(saved.security || {}),
		},
		logoUrl: saved.logoUrl || '',
	};
};

const saveCompanySettings = (companyId, payload = {}) => {
	const store = readSettingsStore();
	const current = getCompanySettings(companyId);

	store[companyId] = {
		notifications: {
			...current.notifications,
			...(payload.notifications || {}),
		},
		security: {
			...current.security,
			...(payload.security || {}),
		},
		logoUrl: payload.logoUrl ?? current.logoUrl,
	};

	writeSettingsStore(store);
	return store[companyId];
};

module.exports = {
	getCompanySettings,
	saveCompanySettings,
};
