import os
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
)
import joblib


# ============================================================
# ResistNova - Contact Priority ML Training
# Synthetic Prototype Dataset
# ============================================================

DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "data",
    "resistnova_synthetic_contact_dataset.csv",
)

MODEL_DIR = os.path.join(
    os.path.dirname(__file__),
    "models",
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "random_forest_contact_priority.joblib",
)


# ------------------------------------------------------------
# 1. Load Dataset
# ------------------------------------------------------------

print("=" * 60)
print("ResistNova ML Training")
print("=" * 60)

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print(f"Dataset loaded successfully.")
print(f"Rows    : {len(df)}")
print(f"Columns : {len(df.columns)}")


# ------------------------------------------------------------
# 2. Features and Target
# ------------------------------------------------------------

FEATURES = [
    "total_overlap_min",
    "overlap_count",
    "avg_overlap_min",
    "same_location_count",
    "recent_overlap_count",
    "contact_frequency",
    "contact_type",
    "location_type",
]

TARGET = "priority_label"


# ------------------------------------------------------------
# 3. Validate Dataset
# ------------------------------------------------------------

missing_features = [
    column for column in FEATURES
    if column not in df.columns
]

if missing_features:
    raise ValueError(
        f"Missing required feature columns: {missing_features}"
    )

if TARGET not in df.columns:
    raise ValueError(
        f"Target column '{TARGET}' not found in dataset."
    )


# Remove rows with missing values in required columns

df = df.dropna(subset=FEATURES + [TARGET]).copy()

print(f"\nRows after cleaning: {len(df)}")


X = df[FEATURES]
y = df[TARGET]


# ------------------------------------------------------------
# 4. Show Class Distribution
# ------------------------------------------------------------

print("\nPriority Label Distribution:")
print(y.value_counts())


# ------------------------------------------------------------
# 5. Define Feature Types
# ------------------------------------------------------------

NUMERICAL_FEATURES = [
    "total_overlap_min",
    "overlap_count",
    "avg_overlap_min",
    "same_location_count",
    "recent_overlap_count",
    "contact_frequency",
]

CATEGORICAL_FEATURES = [
    "contact_type",
    "location_type",
]


# ------------------------------------------------------------
# 6. Preprocessing
# ------------------------------------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            CATEGORICAL_FEATURES,
        ),
        (
            "numerical",
            "passthrough",
            NUMERICAL_FEATURES,
        ),
    ]
)


# ------------------------------------------------------------
# 7. Random Forest Model
# ------------------------------------------------------------

model = RandomForestClassifier(
    n_estimators=300,
    min_samples_split=4,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)


# ------------------------------------------------------------
# 8. Complete ML Pipeline
# ------------------------------------------------------------

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("classifier", model),
    ]
)


# ------------------------------------------------------------
# 9. Train/Test Split
# ------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)


print("\nTraining/Test Split:")
print(f"Training samples: {len(X_train)}")
print(f"Testing samples : {len(X_test)}")


# ------------------------------------------------------------
# 10. Train Model
# ------------------------------------------------------------

print("\nTraining Random Forest...")

pipeline.fit(X_train, y_train)

print("Training completed successfully.")


# ------------------------------------------------------------
# 11. Evaluate Model
# ------------------------------------------------------------

print("\nEvaluating model...")

y_pred = pipeline.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

precision, recall, f1, _ = precision_recall_fscore_support(
    y_test,
    y_pred,
    average="weighted",
    zero_division=0,
)


print("\n" + "=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")


print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0,
    )
)


# ------------------------------------------------------------
# 12. Save Model
# ------------------------------------------------------------

os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(
    pipeline,
    MODEL_PATH,
)

print("=" * 60)
print("MODEL SAVED")
print("=" * 60)

print(f"\nModel file:")
print(MODEL_PATH)

print(
    "\nNOTE: This model is trained on synthetic prototype data."
)
print(
    "Its metrics must NOT be interpreted as real clinical performance."
)
print(
    "The model predicts infection-control review priority,"
)
print(
    "not MDRO positive/negative status."
)

print("\nTraining finished successfully.")