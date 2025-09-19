import streamlit as st
import requests
import pandas as pd
from datetime import datetime

st.set_page_config(page_title="Lambda Function Executor", layout="centered")

# Two tab layout: Execution + Metrics
tab1, tab2 = st.tabs(["⚡ Execute Function", "📊 Metrics Dashboard"])

# === Function Execution UI ===
with tab1:
    st.title("⚡ LAMBDA - Serverless Function UI")

    with st.form("function_form"):
        code = st.text_area("Paste your function code here:", height=200, value='print("Hello World")')
        lang = st.selectbox("Select Language", ["python", "js"])
        use_gvisor = st.checkbox("Use gVisor Runtime")
        submit = st.form_submit_button("Execute")

        if submit:
            if not code.strip():
                st.error("Code cannot be empty.")
            else:
                with st.spinner("Executing function..."):
                    try:
                        response = requests.post(
                            "http://localhost:3001/execute",
                            json={
                                "code": code,
                                "lang": lang,
                                "useGVisor": use_gvisor,
                                "token": "secure123"
                            },
                            timeout=5
                        )
                        if response.status_code == 200:
                            st.success("Function executed successfully!")
                            st.code(response.json().get("output", "No output"), language=lang)
                        else:
                            st.error(f"Execution failed (Status {response.status_code}):")
                            st.code(response.json().get("error", "Unknown error"), language="bash")
                    except requests.exceptions.RequestException as e:
                        st.error(f"Server connection failed: {str(e)}")
                    except Exception as e:
                        st.error(f"Unexpected error: {str(e)}")

# === Metrics Dashboard ===
with tab2:
    st.title("📊 Function Execution Metrics")
    
    try:
        res = requests.get("http://localhost:3001/metrics", timeout=3)
        
        if res.status_code == 200:
            data = res.json()
            
            if not data:
                st.warning("No metrics data available yet. Execute some functions first!")
            else:
                df = pd.DataFrame([
                    {
                        "Runtime": runtime,
                        "Total Requests": m["totalRequests"],
                        "Average Time (ms)": round(m["averageTime"], 2),
                        "Error Rate (%)": round(m["errorRate"] * 100, 2),
                        "Last Updated": datetime.now().strftime("%H:%M:%S")
                    }
                    for runtime, m in data.items()
                ])

                # Metrics Summary Cards
                col1, col2, col3 = st.columns(3)
                total_calls = df["Total Requests"].sum()
                avg_time = df["Average Time (ms)"].mean()
                error_count = int((df["Error Rate (%)"] * df["Total Requests"] / 100).sum())
                
                col1.metric("📥 Total Calls", total_calls)
                col2.metric("⚡ Avg Time", f"{round(avg_time, 2)} ms")
                col3.metric("❌ Errors", error_count)

                # Charts
                st.subheader("Request Volume")
                st.bar_chart(df.set_index("Runtime")["Total Requests"])
                
                st.subheader("Performance Metrics")
                st.dataframe(df.sort_values("Total Requests", ascending=False))
                
        else:
            st.error(f"Metrics server returned status {res.status_code}")
            
    except requests.exceptions.RequestException as e:
        st.error(f"Failed to connect to metrics server: {str(e)}")
    except ValueError as e:
        st.error(f"Invalid metrics data: {str(e)}")
    except Exception as e:
        st.error(f"Unexpected error: {str(e)}")
