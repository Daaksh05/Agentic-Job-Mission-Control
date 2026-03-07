COUNTRY_CONFIG = {
    "FR": {"priority": 1, "weight": 1.0,  "label": "Primary 🇫🇷"},
    "GB": {"priority": 2, "weight": 0.85, "label": "Active 🇬🇧"},
    "DE": {"priority": 2, "weight": 0.85, "label": "Active 🇩🇪"},
    "NL": {"priority": 2, "weight": 0.80, "label": "Active 🇳🇱"},
    "BE": {"priority": 2, "weight": 0.80, "label": "Active 🇧🇪"},
    "CH": {"priority": 2, "weight": 0.80, "label": "Active 🇨🇭"},
    "CA": {"priority": 3, "weight": 0.70, "label": "Active 🇨🇦"},
    "AU": {"priority": 3, "weight": 0.70, "label": "Active 🇦🇺"},
    "US": {"priority": 3, "weight": 0.65, "label": "Active 🇺🇸"},
    "IN": {"priority": 3, "weight": 0.65, "label": "Active 🇮🇳"},
    "SG": {"priority": 3, "weight": 0.65, "label": "Active 🇸🇬"},
    "REMOTE": {"priority": 2, "weight": 0.80, "label": "Active 🌐"},
}

COUNTRY_SCORE_BOOST = {
    "FR": 1.15,   # 15% boost — always surfaces first
    "BE": 1.05,   # Belgium — French-speaking, slight boost
    "CH": 1.03,   # Switzerland — French cantons
}

PRIMARY_COUNTRY = "FR"
ACTIVE_COUNTRIES = list(COUNTRY_CONFIG.keys())
API_QUOTA_ALLOCATION = {
    "FR": 0.40,
    "REMOTE": 0.20,
    "EU": 0.25, # GB, DE, NL, BE, CH
    "REST": 0.15 # US, CA, AU, IN, SG
}
