const prisma = require('../dbs/db');
const { getCompanySettings, saveCompanySettings } = require('../services/companySettingsStore');
const { serializeCompany } = require('../utils/serializers');
const logger = require('../utils/logger');

const getCompanyProfile = async (req, res) => {
	try {
		const company = await prisma.company.findUnique({
			where: {
				id: req.user.company_id,
			},
		});

		if (!company) {
			return res.status(404).json({ message: 'Company not found.' });
		}

		return res.status(200).json(
			serializeCompany(company, getCompanySettings(company.id)),
		);
	} catch (error) {
		logger.error(`Failed to fetch company ${req.user?.company_id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to fetch company settings.' });
	}
};

const updateCompanyProfile = async (req, res) => {
	try {
		const company = await prisma.company.findUnique({
			where: {
				id: req.user.company_id,
			},
		});

		if (!company) {
			return res.status(404).json({ message: 'Company not found.' });
		}

		const updatedCompany = await prisma.company.update({
			where: {
				id: company.id,
			},
			data: {
				name: req.body?.name || company.name,
			},
		});

		const settings = saveCompanySettings(company.id, {
			notifications: req.body?.notifications,
			security: req.body?.security,
			logoUrl: req.body?.logoUrl,
		});

		logger.info(`Company ${company.id} settings updated by admin ${req.user.id}.`);

		return res.status(200).json(
			serializeCompany(updatedCompany, settings),
		);
	} catch (error) {
		logger.error(`Failed to update company ${req.user?.company_id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to update company settings.' });
	}
};

module.exports = {
	getCompanyProfile,
	updateCompanyProfile,
};
