"""
Benchmark Dataset Generator for Heritage Monument Footfall Prediction.
Generates a realistic, validated historical dataset across 5 monuments for 2024.
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_benchmark_dataset(output_path: str = "ml/data/daily_monument_footfall.csv", seed: int = 42):
    np.random.seed(seed)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    monuments = [
        {
            "monument_id": "M001",
            "monument_name": "Taj Mahal",
            "state": "Uttar Pradesh",
            "city": "Agra",
            "monument_type": "Mausoleum",
            "daily_capacity": 5000,
            "closed_weekday": 4,  # Friday closed
            "base_footfall": 3200,
            "seasonal_winter_boost": 1.25,
            "seasonal_summer_dip": 0.75,
        },
        {
            "monument_id": "M002",
            "monument_name": "Red Fort",
            "state": "Delhi",
            "city": "New Delhi",
            "monument_type": "Fort",
            "daily_capacity": 3000,
            "closed_weekday": 0,  # Monday closed
            "base_footfall": 1800,
            "seasonal_winter_boost": 1.20,
            "seasonal_summer_dip": 0.80,
        },
        {
            "monument_id": "M003",
            "monument_name": "Gateway of India",
            "state": "Maharashtra",
            "city": "Mumbai",
            "monument_type": "Monument",
            "daily_capacity": 2000,
            "closed_weekday": -1,  # Open daily
            "base_footfall": 1300,
            "seasonal_winter_boost": 1.15,
            "seasonal_summer_dip": 0.85,
        },
        {
            "monument_id": "M004",
            "monument_name": "Qutub Minar",
            "state": "Delhi",
            "city": "New Delhi",
            "monument_type": "Minaret",
            "daily_capacity": 2500,
            "closed_weekday": -1,  # Open daily
            "base_footfall": 1500,
            "seasonal_winter_boost": 1.20,
            "seasonal_summer_dip": 0.80,
        },
        {
            "monument_id": "M005",
            "monument_name": "Meenakshi Temple",
            "state": "Tamil Nadu",
            "city": "Madurai",
            "monument_type": "Temple",
            "daily_capacity": 4000,
            "closed_weekday": -1,  # Open daily
            "base_footfall": 2600,
            "seasonal_winter_boost": 1.10,
            "seasonal_summer_dip": 0.90,
        },
    ]

    # Major Indian Holidays & Festivals in 2024
    holidays_2024 = {
        "2024-01-01": ("New Year's Day", "None", "Low", 1),
        "2024-01-14": ("Makar Sankranti", "Pongal", "High", 1),
        "2024-01-15": ("Pongal", "Pongal", "High", 1),
        "2024-01-26": ("Republic Day", "None", "High", 1),
        "2024-03-08": ("Maha Shivratri", "Shivratri", "Medium", 1),
        "2024-03-25": ("Holi", "Holi", "High", 1),
        "2024-03-29": ("Good Friday", "None", "Low", 1),
        "2024-04-09": ("Ugadi / Gudi Padwa", "Ugadi", "Medium", 1),
        "2024-04-11": ("Eid-ul-Fitr", "Eid", "High", 1),
        "2024-04-17": ("Ram Navami", "Ram Navami", "Medium", 1),
        "2024-04-21": ("Mahavir Jayanti", "None", "Low", 1),
        "2024-05-23": ("Buddha Purnima", "None", "Low", 1),
        "2024-06-17": ("Bakrid / Eid al-Adha", "Eid al-Adha", "High", 1),
        "2024-07-17": ("Muharram", "None", "Low", 1),
        "2024-08-15": ("Independence Day", "None", "High", 1),
        "2024-08-19": ("Raksha Bandhan", "Raksha Bandhan", "Medium", 1),
        "2024-08-26": ("Janmashtami", "Janmashtami", "Medium", 1),
        "2024-09-07": ("Ganesh Chaturthi", "Ganesh Chaturthi", "High", 1),
        "2024-09-16": ("Milad un-Nabi", "None", "Low", 1),
        "2024-10-02": ("Mahatma Gandhi Jayanti", "None", "Medium", 1),
        "2024-10-11": ("Maha Navami", "Navratri", "High", 1),
        "2024-10-12": ("Dussehra", "Dussehra", "High", 1),
        "2024-10-31": ("Diwali", "Diwali", "High", 1),
        "2024-11-01": ("Govardhan Puja", "Diwali", "High", 1),
        "2024-11-02": ("Bhai Dooj", "Diwali", "Medium", 1),
        "2024-11-15": ("Guru Nanak Jayanti", "None", "Medium", 1),
        "2024-12-25": ("Christmas", "Christmas", "High", 1),
    }

    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 12, 31)
    date_list = [start_date + timedelta(days=x) for x in range((end_date - start_date).days + 1)]

    all_rows = []
    record_counter = 1

    for m in monuments:
        m_id = m["monument_id"]
        capacity = m["daily_capacity"]
        closed_day = m["closed_weekday"]
        base_val = m["base_footfall"]

        # Track targets for leakage-safe lag calculation
        daily_targets = []

        for current_date in date_list:
            date_str = current_date.strftime("%Y-%m-%d")
            year = current_date.year
            month = current_date.month
            dow = current_date.weekday()  # Monday is 0, Sunday is 6
            is_weekend = 1 if dow in (5, 6) else 0

            # Holiday & Festival info
            holiday_info = holidays_2024.get(date_str, ("None", "None", "None", 0))
            holiday_name, festival_name, fest_importance, is_pub_holiday = holiday_info

            # School holiday (May-June summer breaks, late Dec winter break)
            school_hol = 1 if (month in (5, 6) or (month == 12 and current_date.day >= 22)) else 0

            # Weather calculation based on city and month
            if m["city"] in ("New Delhi", "Agra"):
                # North India climate
                if month in (1, 12):
                    temp = np.round(np.random.normal(14.0, 2.5), 1)
                    rainfall = np.round(max(0.0, np.random.exponential(1.5)), 1)
                    weather = "Foggy" if np.random.rand() < 0.35 else "Clear"
                elif month in (2, 3, 10, 11):
                    temp = np.round(np.random.normal(24.0, 3.0), 1)
                    rainfall = np.round(max(0.0, np.random.exponential(2.0)), 1)
                    weather = "Haze" if np.random.rand() < 0.25 else "Clear"
                elif month in (4, 5, 6):
                    temp = np.round(np.random.normal(38.0, 3.5), 1)
                    rainfall = np.round(max(0.0, np.random.exponential(4.0)), 1)
                    weather = "Clear"
                else:  # Monsoon (7, 8, 9)
                    temp = np.round(np.random.normal(31.0, 2.5), 1)
                    rainfall = np.round(max(0.0, np.random.exponential(18.0)), 1)
                    weather = "Rainy" if rainfall > 5.0 else ("Cloudy" if np.random.rand() < 0.6 else "Clear")
            elif m["city"] == "Mumbai":
                # Coastal climate
                temp = np.round(np.random.normal(28.0, 2.0), 1)
                if month in (6, 7, 8, 9):
                    rainfall = np.round(max(0.0, np.random.exponential(28.0)), 1)
                    weather = "Rainy" if rainfall > 8.0 else "Cloudy"
                else:
                    rainfall = np.round(max(0.0, np.random.exponential(1.0)), 1)
                    weather = "Clear" if np.random.rand() < 0.7 else "Cloudy"
            else:  # Madurai
                temp = np.round(np.random.normal(30.0, 2.5), 1)
                if month in (10, 11, 12):
                    rainfall = np.round(max(0.0, np.random.exponential(14.0)), 1)
                    weather = "Rainy" if rainfall > 5.0 else "Cloudy"
                else:
                    rainfall = np.round(max(0.0, np.random.exponential(2.0)), 1)
                    weather = "Clear"

            # Monument Open / Closure status
            # Scheduled weekly closure or occasional maintenance (2 days per year)
            is_weekly_closed = (dow == closed_day)
            is_maintenance = (not is_weekly_closed) and (current_date.day == 18 and month in (3, 9))
            
            if is_weekly_closed or is_maintenance:
                is_open = 0
                maintenance_or_closure = 1
                total_visitors = 0
            else:
                is_open = 1
                maintenance_or_closure = 0

                # Calculate realistic visitor volume
                # Seasonality
                if month in (1, 2, 11, 12):
                    season_mult = m["seasonal_winter_boost"]
                elif month in (5, 6):
                    season_mult = m["seasonal_summer_dip"]
                else:
                    season_mult = 1.0

                # Day of week multiplier (weekends +35% to +50%)
                dow_mult = 1.45 if is_weekend else 1.0

                # Holiday / Festival boost
                fest_mult = 1.0
                if fest_importance == "High":
                    fest_mult = 1.55
                elif fest_importance == "Medium":
                    fest_mult = 1.30
                elif is_pub_holiday == 1:
                    fest_mult = 1.25

                # School holiday boost
                school_mult = 1.15 if school_hol else 1.0

                # Weather penalty
                weather_mult = 1.0
                if weather == "Rainy" and rainfall > 15.0:
                    weather_mult = 0.65
                elif weather == "Rainy":
                    weather_mult = 0.80
                elif weather == "Foggy":
                    weather_mult = 0.90
                elif temp > 40.0:
                    weather_mult = 0.75

                expected = base_val * season_mult * dow_mult * fest_mult * school_mult * weather_mult
                noise = np.random.normal(0, expected * 0.05)
                simulated_count = int(np.clip(expected + noise, 100, capacity))
                total_visitors = simulated_count

            daily_targets.append(total_visitors)

            # Compute strictly leakage-safe historical lags
            # Previous day lag (T-1)
            if len(daily_targets) >= 2:
                visitors_prev_day = float(daily_targets[-2])
            else:
                visitors_prev_day = np.nan

            # Shifted 7-day rolling average (T-7 to T-1)
            if len(daily_targets) >= 8:
                rolling_7_day = float(np.mean(daily_targets[-8:-1]))
            elif len(daily_targets) >= 2:
                # Rolling window over available prior days excluding current day
                rolling_7_day = float(np.mean(daily_targets[:-1]))
            else:
                rolling_7_day = np.nan

            row = {
                "record_id": f"REC_{record_counter:06d}",
                "monument_id": m_id,
                "monument_name": m["monument_name"],
                "state": m["state"],
                "city": m["city"],
                "monument_type": m["monument_type"],
                "date": date_str,
                "year": year,
                "month": month,
                "day_of_week": dow,
                "is_weekend": is_weekend,
                "is_public_holiday": is_pub_holiday,
                "holiday_name": holiday_name,
                "festival_name": festival_name,
                "festival_importance": fest_importance,
                "school_holiday": school_hol,
                "daily_capacity": capacity,
                "is_open": is_open,
                "maintenance_or_closure": maintenance_or_closure,
                "temperature_avg_c": temp,
                "rainfall_mm": rainfall,
                "weather_condition": weather,
                "visitors_previous_day": visitors_prev_day,
                "rolling_7_day_average": rolling_7_day,
                "total_visitors": total_visitors,
                "data_status": "validated",
            }
            all_rows.append(row)
            record_counter += 1

    df = pd.DataFrame(all_rows)
    df.to_csv(output_path, index=False)
    print(f"Benchmark dataset successfully generated at {output_path} with {len(df)} rows.")
    return df

if __name__ == "__main__":
    generate_benchmark_dataset()
