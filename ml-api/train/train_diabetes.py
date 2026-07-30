import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

def train_diabetes_model():
    print("--- Training Diabetes Model ---")
    data_path = "../../backend/src/data/diabetes.csv"
    if not os.path.exists(data_path):
        data_path = "../backend/src/data/diabetes.csv"
    
    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    
    # Handle missing values
    df = df.dropna()
    
    # Map target Diabetes_012 to binary target (0.0 -> 0 (No), 1.0 or 2.0 -> 1 (Yes))
    df['target'] = (df['Diabetes_012'] > 0).astype(int)
    
    # Use features that correspond to frontend assessment form fields
    feature_cols = ['HighBP', 'HighChol', 'BMI', 'Smoker', 'Stroke', 'HeartDiseaseorAttack', 'PhysActivity', 'HvyAlcoholConsump', 'Sex', 'Age']
    
    X = df[feature_cols]
    y = df['target']
    
    # Downsample for faster execution in training script
    if len(df) > 50000:
        print("Downsampling dataset to 50,000 rows for faster training...")
        X, _, y, _ = train_test_split(X, y, train_size=50000, random_state=42, stratify=y)
        
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    models = {
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42),
        'GradientBoosting': GradientBoostingClassifier(n_estimators=50, max_depth=5, random_state=42)
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
    y_prob = best_model.predict_proba(X_test)[:, 1] if hasattr(best_model, "predict_proba") else y_pred
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n--- Final Performance Metrics ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC AUC:   {roc_auc:.4f}")
    print("Confusion Matrix:\n", cm)
    
    # Save the best model
    os.makedirs("../models", exist_ok=True)
    model_path = "../models/diabetes_model.pkl"
    joblib.dump(best_model, model_path)
    print(f"Successfully saved diabetes model to: {model_path}\n")

if __name__ == "__main__":
    train_diabetes_model()
