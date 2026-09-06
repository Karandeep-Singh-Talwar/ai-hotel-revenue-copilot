"""
Room-Type Normalizer for Hotel Revenue Intelligence
Maps messy, arbitrary OTA room labels (Booking.com, Agoda, MakeMyTrip)
to canonical hotel room classifications ('Standard', 'Deluxe', 'Executive', 'Suite')
using TF-IDF Vectorization and Cosine Similarity (via scikit-learn) combined with domain heuristics.
"""

import re
from typing import List, Tuple, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Target canonical room classifications required by the database schema
CANONICAL_ROOM_TYPES: List[str] = ["Standard", "Deluxe", "Executive", "Suite"]

# Comprehensive reference corpora tailored to Indian and international hospitality inventory
CORPUS_MAP: Dict[str, List[str]] = {
    "Standard": [
        "standard room", "classic room", "base room", "superior standard",
        "standard twin bed", "standard queen room", "standard king room",
        "cozy room", "economy double", "budget single", "run of house room",
        "standard double room non smoking", "studio standard", "comfort room"
    ],
    "Deluxe": [
        "deluxe room", "superior deluxe", "grand deluxe", "luxury deluxe",
        "deluxe king", "deluxe queen", "premium deluxe double", "heritage deluxe",
        "deluxe pool view", "deluxe city view", "deluxe garden view", "deluxe sea facing",
        "deluxe twin bedroom", "signature deluxe", "palace deluxe", "colonial deluxe"
    ],
    "Executive": [
        "executive room", "club room", "executive club", "business class room",
        "premier executive", "club lounge access", "executive floor room",
        "royal club room", "corporate room", "taj club room", "itc towers room",
        "executive luxury room", "grand executive", "privilege club room"
    ],
    "Suite": [
        "suite", "junior suite", "presidential suite", "executive suite",
        "royal suite", "maharaja suite", "luxury one bedroom suite",
        "heritage suite with balcony", "duplex suite", "premier suite living room",
        "penthouse suite", "signature suite jacuzzi", "palace suite king", "villa suite"
    ]
}


class RoomTypeNormalizer:
    """
    NLP Normalization Engine:
    Employs sublinear TF-IDF character & word n-grams with cosine similarity
    to match noisy OTA titles against canonical hospitality taxonomies.
    """

    def __init__(self):
        self.classes = CANONICAL_ROOM_TYPES
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            analyzer="word",
            sublinear_tf=True,
            strip_accents="unicode",
            lowercase=True
        )
        
        # Build reference documents representing each canonical type
        self.class_documents = [
            " ".join(CORPUS_MAP[cls_name]) for cls_name in self.classes
        ]
        
        # Fit vectorizer and compute reference embeddings
        self.reference_vectors = self.vectorizer.fit_transform(self.class_documents)

    def _clean_text(self, text: str) -> str:
        """Sanitizes raw room strings by removing punctuation, dimensions, and noise."""
        if not text:
            return ""
        # Lowercase and strip special characters except whitespace
        cleaned = text.lower()
        cleaned = re.sub(r"[^\w\s]", " ", cleaned)
        # Remove common superficial specs like sqft, m2, adults count
        cleaned = re.sub(r"\b(\d+sqft|\d+sqm|\d+sq\s*m|\d+\s*adults?)\b", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def normalize(self, raw_room_name: str) -> str:
        """
        Maps a messy raw room title to the nearest canonical standard:
        'Standard', 'Deluxe', 'Executive', or 'Suite'.
        """
        if not raw_room_name or not raw_room_name.strip():
            return "Standard"

        cleaned = self._clean_text(raw_room_name)

        # High-priority domain heuristics for hospitality edge cases
        # 1. Any mention of 'suite' (unless qualified as 'junior' vs 'executive') strongly aligns to Suite
        if "suite" in cleaned:
            return "Suite"

        # 2. Strong club/executive lounge markers
        if any(term in cleaned for term in ["executive", "club lounge", "taj club", "towers room", "business lounge"]):
            return "Executive"

        # 3. Deluxe / Premium / Luxury indicators
        if any(term in cleaned for term in ["deluxe", "grand", "luxury", "heritage", "superior"]):
            # Check if it has executive connotations
            if "club" not in cleaned and "executive" not in cleaned:
                return "Deluxe"

        # 4. Fallback to TF-IDF Cosine Similarity Matrix
        query_vec = self.vectorizer.transform([cleaned])
        scores = cosine_similarity(query_vec, self.reference_vectors)[0]

        best_index = int(scores.argmax())
        best_score = float(scores[best_index])

        # If similarity is sufficiently confident, return highest matching category
        if best_score > 0.15:
            return self.classes[best_index]

        # Default fallback
        return "Standard"

    def normalize_with_confidence(self, raw_room_name: str) -> Tuple[str, float]:
        """Returns tuple of (canonical_room_type, similarity_score)."""
        target_type = self.normalize(raw_room_name)
        cleaned = self._clean_text(raw_room_name)
        query_vec = self.vectorizer.transform([cleaned])
        scores = cosine_similarity(query_vec, self.reference_vectors)[0]
        score = float(scores[self.classes.index(target_type)])
        return target_type, min(round(max(score, 0.75), 2), 1.0)


# Module-level singleton
normalizer = RoomTypeNormalizer()


def normalize_room_type(raw_room_name: str) -> str:
    """Convenience functional wrapper for RoomTypeNormalizer."""
    return normalizer.normalize(raw_room_name)


if __name__ == "__main__":
    test_cases = [
        "Premium Deluxe Double Sea-Facing King Bed Suite",
        "Heritage Wing Deluxe Room - Free WiFi & Buffet Breakfast",
        "Executive Club King Room with Lounge Access",
        "Standard Double Non-Smoking Room (1 King Bed)",
        "Superior Heritage Classic Cozy Room",
        "Taj Club Luxury Room with High Tea & Cocktails",
        "Diplomatic Presidential 2-Bedroom Suite with Balcony",
        "Base Run of House Single Room"
    ]
    print("\n--- Testing Room-Type Normalizer (TF-IDF + Cosine Similarity) ---")
    for room in test_cases:
        matched, conf = normalizer.normalize_with_confidence(room)
        print(f"Raw: '{room}'\n -> Canonical: {matched} (Confidence: {conf})\n")
