"""
Feedback Analyzer Service
Handles feedback sentiment analysis and topic classification
"""

import logging
import time
from typing import List, Dict, Any
from datetime import datetime
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import numpy as np

from .models import FeedbackResponse, FeedbackClassification, FeedbackSummary

logger = logging.getLogger(__name__)

class FeedbackAnalyzer:
    """Analyzes feedback for sentiment and topics"""
    
    def __init__(self):
        """Initialize the feedback analyzer"""
        self.feedback_store = []
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Predefined feedback categories
        self.feedback_categories = {
            "infrastructure": ["road", "bridge", "parking", "traffic", "transport", "public transport"],
            "environment": ["green", "park", "trees", "pollution", "sustainability", "climate"],
            "safety": ["security", "lighting", "crossing", "pedestrian", "bicycle", "emergency"],
            "accessibility": ["wheelchair", "ramp", "elevator", "disabled", "elderly", "children"],
            "aesthetics": ["beautiful", "ugly", "design", "architecture", "landscape", "view"],
            "noise": ["quiet", "loud", "noise", "sound", "traffic noise", "construction"],
            "cost": ["expensive", "cheap", "budget", "cost", "money", "funding"],
            "maintenance": ["clean", "dirty", "maintenance", "repair", "upkeep", "broken"]
        }
        
        # Sentiment thresholds
        self.sentiment_thresholds = {
            "positive": 0.1,
            "neutral": -0.1,
            "negative": -0.1
        }
    
    async def analyze_feedback(self, feedback_text: str) -> FeedbackResponse:
        """Analyze feedback for sentiment and extract topics"""
        try:
            start_time = time.time()
            
            # Perform sentiment analysis
            sentiment_score, sentiment_label = self._analyze_sentiment(feedback_text)
            
            # Extract topics
            topics = self._extract_topics(feedback_text)
            
            # Calculate confidence (simplified)
            confidence = self._calculate_confidence(sentiment_score, len(topics))
            
            processing_time = time.time() - start_time
            
            # Create response
            response = FeedbackResponse(
                feedback_text=feedback_text,
                sentiment_score=sentiment_score,
                sentiment_label=sentiment_label,
                topics=topics,
                confidence=confidence,
                processing_time=processing_time
            )
            
            # Store feedback for analysis
            self.feedback_store.append({
                "text": feedback_text,
                "sentiment_score": sentiment_score,
                "sentiment_label": sentiment_label,
                "topics": topics,
                "timestamp": datetime.now()
            })
            
            logger.info(f"Feedback analyzed successfully in {processing_time:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"Error analyzing feedback: {str(e)}")
            raise
    
    def _analyze_sentiment(self, text: str) -> tuple[float, str]:
        """Analyze sentiment using TextBlob"""
        try:
            blob = TextBlob(text)
            sentiment_score = blob.sentiment.polarity
            
            # Classify sentiment
            if sentiment_score > self.sentiment_thresholds["positive"]:
                sentiment_label = "positive"
            elif sentiment_score < self.sentiment_thresholds["negative"]:
                sentiment_label = "negative"
            else:
                sentiment_label = "neutral"
            
            return sentiment_score, sentiment_label
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return 0.0, "neutral"
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract topics from feedback text"""
        try:
            topics = []
            text_lower = text.lower()
            
            # Check for predefined categories
            for category, keywords in self.feedback_categories.items():
                for keyword in keywords:
                    if keyword in text_lower:
                        topics.append(category)
                        break  # Only add category once
            
            # If no predefined topics found, extract key phrases
            if not topics:
                blob = TextBlob(text)
                # Extract noun phrases as potential topics
                noun_phrases = blob.noun_phrases
                topics = [phrase for phrase in noun_phrases[:3]]  # Limit to 3 topics
            
            return topics if topics else ["general"]
            
        except Exception as e:
            logger.error(f"Error extracting topics: {str(e)}")
            return ["general"]
    
    def _calculate_confidence(self, sentiment_score: float, topic_count: int) -> float:
        """Calculate confidence score for the analysis"""
        try:
            # Base confidence on sentiment strength and topic clarity
            sentiment_confidence = min(abs(sentiment_score) * 2, 1.0)  # Higher confidence for stronger sentiment
            topic_confidence = min(topic_count * 0.2, 1.0)  # Higher confidence for more topics
            
            # Average the confidences
            confidence = (sentiment_confidence + topic_confidence) / 2
            
            # Ensure confidence is between 0 and 1
            return max(0.0, min(1.0, confidence))
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {str(e)}")
            return 0.5
    
    async def classify_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Classify feedback into predefined categories with priority"""
        try:
            # Analyze feedback first
            analysis = await self.analyze_feedback(feedback_text)
            
            # Determine primary category
            primary_category = analysis.topics[0] if analysis.topics else "general"
            
            # Determine priority based on sentiment and category
            priority = self._determine_priority(analysis.sentiment_score, primary_category)
            
            # Get subcategories
            subcategories = self.feedback_categories.get(primary_category, [])
            
            classification = FeedbackClassification(
                category=primary_category,
                confidence=analysis.confidence,
                subcategories=subcategories,
                priority=priority
            )
            
            return classification.dict()
            
        except Exception as e:
            logger.error(f"Error classifying feedback: {str(e)}")
            raise
    
    def _determine_priority(self, sentiment_score: float, category: str) -> str:
        """Determine priority level for feedback"""
        try:
            # High priority for negative feedback in critical categories
            critical_categories = ["safety", "accessibility", "infrastructure"]
            
            if category in critical_categories and sentiment_score < -0.3:
                return "high"
            elif sentiment_score < -0.2:
                return "medium"
            elif sentiment_score > 0.3:
                return "low"  # Positive feedback is lower priority
            else:
                return "medium"
                
        except Exception as e:
            logger.error(f"Error determining priority: {str(e)}")
            return "medium"
    
    async def get_feedback_summary(self) -> FeedbackSummary:
        """Get summary statistics for all feedback"""
        try:
            if not self.feedback_store:
                return FeedbackSummary(
                    total_feedback_count=0,
                    sentiment_distribution={"positive": 0, "neutral": 0, "negative": 0},
                    category_distribution={},
                    average_sentiment_score=0.0,
                    recent_feedback_count=0
                )
            
            # Calculate sentiment distribution
            sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
            category_counts = {}
            total_sentiment = 0.0
            
            for feedback in self.feedback_store:
                # Count sentiments
                sentiment_counts[feedback["sentiment_label"]] += 1
                
                # Count categories
                for topic in feedback["topics"]:
                    category_counts[topic] = category_counts.get(topic, 0) + 1
                
                # Sum sentiment scores
                total_sentiment += feedback["sentiment_score"]
            
            # Calculate averages
            total_count = len(self.feedback_store)
            average_sentiment = total_sentiment / total_count if total_count > 0 else 0.0
            
            # Count recent feedback (last 24 hours)
            recent_cutoff = datetime.now().timestamp() - (24 * 60 * 60)
            recent_count = sum(
                1 for feedback in self.feedback_store
                if feedback["timestamp"].timestamp() > recent_cutoff
            )
            
            summary = FeedbackSummary(
                total_feedback_count=total_count,
                sentiment_distribution=sentiment_counts,
                category_distribution=category_counts,
                average_sentiment_score=average_sentiment,
                recent_feedback_count=recent_count
            )
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating feedback summary: {str(e)}")
            raise
    
    def _cluster_feedback(self, feedback_texts: List[str]) -> List[List[str]]:
        """Cluster feedback texts using TF-IDF and K-means"""
        try:
            if len(feedback_texts) < 2:
                return [feedback_texts]
            
            # Vectorize texts
            vectors = self.vectorizer.fit_transform(feedback_texts)
            
            # Determine optimal number of clusters
            n_clusters = min(5, len(feedback_texts) // 2)
            if n_clusters < 2:
                n_clusters = 2
            
            # Perform clustering
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            clusters = kmeans.fit_predict(vectors)
            
            # Group texts by cluster
            clustered_feedback = [[] for _ in range(n_clusters)]
            for i, cluster_id in enumerate(clusters):
                clustered_feedback[cluster_id].append(feedback_texts[i])
            
            return clustered_feedback
            
        except Exception as e:
            logger.error(f"Error clustering feedback: {str(e)}")
            return [feedback_texts]
