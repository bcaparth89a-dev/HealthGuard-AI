import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def train_bmi_model():
    print("--- Training BMI Model ---")
    data_path = "../../backend/src/data/bmi.csv"
    if not os.path.exists(data_path):
        data_path = "../backend/src/data/bmi.csv"
        
    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    
    # Handle missing values
    df = df.dropna()
    
    # Encode categorical columns
    df['gender_numeric'] = df['Gender'].map({'Male': 1, 'Female': 0}).fillna(0).astype(int)
    
    feature_cols = ['gender_numeric', 'Height', 'Weight']
    X = df[feature_cols]
    y = df['Index']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    models = {
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42),
        'GradientBoosting': GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
    }
    
    best_model = None
    best_acc = 0.0
    best_name = ""
    
    for name, model in models.items():
        # Perform cross validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=3, scoring='accuracy')
        mean_cv_acc = np.mean(cv_scores)
        print(f"Model: {name} | CV Accuracy: {mean_cv_acc:.4f}")
        
        # Fit and evaluate
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        test_acc = accuracy_score(y_test, y_pred)
        print(f"Model: {name} | Test Accuracy: {test_acc:.4f}")
        
        if test_acc > best_acc:
            best_acc = test_acc
            best_model = model
            best_name = name
            
    print(f"Selected Best Model: {best_name} with test accuracy: {best_acc:.4f}")
    
    # Final metrics evaluation
    y_pred = best_model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='weighted')
    rec = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n--- Final Performance Metrics ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("Confusion Matrix:\n", cm)
    
    # Save the best model
    os.makedirs("../models", exist_ok=True)
    model_path = "../models/bmi_model.pkl"
    joblib.dump(best_model, model_path)
    print(f"Successfully saved BMI model to: {model_path}\n")

if __name__ == "__main__":
    train_bmi_model()
