import os
import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# ============================================================
# ResistNova ML Service
# Random Forest Contact Priority Prediction
# ============================================================

app = FastAPI(
    title="ResistNova ML Service",
    description="Contact priority prediction for infection-control review",
    version="1.0.0",
)


# ============================================================
# Model Path
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "random_forest_contact_priority.joblib",
)


# ============================================================
# Load Model
# ============================================================

try:

    model = joblib.load(MODEL_PATH)

    print("Random Forest model loaded successfully.")
    print(f"Model: {MODEL_PATH}")

except Exception as error:

    model = None

    print("WARNING: Could not load ML model.")
    print(f"Reason: {error}")


# ============================================================
# Request Schema
# ============================================================

class ContactData(BaseModel):

    total_overlap_min: float = Field(
        ge=0
    )

    overlap_count: int = Field(
        ge=0
    )

    avg_overlap_min: float = Field(
        ge=0
    )

    same_location_count: int = Field(
        ge=0
    )

    recent_overlap_count: int = Field(
        ge=0
    )

    contact_frequency: float = Field(
        ge=0
    )

    contact_type: str

    location_type: str


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "success": True,
        "service": "ResistNova ML Service",
        "status": "running",
        "model": "Random Forest",
        "purpose": "Infection-control review priority",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "success": True,
        "status": "healthy",
        "model_loaded": model is not None,
    }


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
def predict(data: ContactData):

    if model is None:

        raise HTTPException(
            status_code=503,
            detail="ML model is not loaded.",
        )


    try:

        # ----------------------------------------------------
        # IMPORTANT:
        # The trained sklearn pipeline uses column names.
        # Therefore input MUST be a pandas DataFrame.
        # ----------------------------------------------------

        input_data = pd.DataFrame(
            [
                {
                    "total_overlap_min":
                        data.total_overlap_min,

                    "overlap_count":
                        data.overlap_count,

                    "avg_overlap_min":
                        data.avg_overlap_min,

                    "same_location_count":
                        data.same_location_count,

                    "recent_overlap_count":
                        data.recent_overlap_count,

                    "contact_frequency":
                        data.contact_frequency,

                    "contact_type":
                        data.contact_type,

                    "location_type":
                        data.location_type,
                }
            ]
        )


        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        prediction = model.predict(
            input_data
        )[0]


        # ----------------------------------------------------
        # Probability
        # ----------------------------------------------------

        probabilities = model.predict_proba(
            input_data
        )[0]


        classes = model.classes_


        probability_map = {
            str(label): float(probability)
            for label, probability in zip(
                classes,
                probabilities
            )
        }


        prediction_score = probability_map.get(
            str(prediction),
            0.0
        )


        score_percent = round(
            prediction_score * 100,
            2
        )


        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return {

            "success": True,

            "prediction":
                str(prediction),

            "score":
                score_percent,

            "scoreUnit":
                "%",

            "purpose":
                "Infection-control review priority",

            "isDiagnosis":
                False,

            "isMdroPrediction":
                False,

            "probabilities": {

                "Low":
                    round(
                        probability_map.get(
                            "Low",
                            0
                        ) * 100,
                        2
                    ),

                "Medium":
                    round(
                        probability_map.get(
                            "Medium",
                            0
                        ) * 100,
                        2
                    ),

                "High":
                    round(
                        probability_map.get(
                            "High",
                            0
                        ) * 100,
                        2
                    ),
            },
        }


    except Exception as error:

        print("=" * 60)
        print("PREDICTION ERROR")
        print("=" * 60)
        print(type(error).__name__)
        print(str(error))
        print("=" * 60)


        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}",
        )