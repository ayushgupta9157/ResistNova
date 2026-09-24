const getRiskPrediction = async (features) => {
  try {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contactCount: features.contactCount,
        interactionCount: features.interactionCount,
        totalDuration: features.totalDuration,
        directCare: features.directCare
      })
    });

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    throw new Error(`ML service unavailable: ${error.message}`);
  }
};

module.exports = {
  getRiskPrediction
};