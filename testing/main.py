import json
import pandas as pd
import matplotlib.pyplot as plt

# 1. Load the JSON file
file_path = 'contest.status?contestId=2237.json' # Update this to your file's name
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 2. Filter only for 'CONTESTANT'
contestant_subs = [
    s for s in data["result"] 
    if s.get("author", {}).get("participantType") == "CONTESTANT"
]

print(f"Total Contestant Submissions: {len(contestant_subs)}")

# 3. Extract timestamps and load into a DataFrame
timestamps = [s["creationTimeSeconds"] for s in contestant_subs]
df = pd.DataFrame(timestamps, columns=['timestamp'])

# 4. Calculate Max Submissions per Second (Peak Throughput)
subs_per_sec = df['timestamp'].value_counts().sort_index()
max_sps = subs_per_sec.max()
print(f"Peak Throughput: {max_sps} submissions per second")

# 5. Calculate Submissions per Minute (Better for graphing)
# Shift timestamps so the start of the contest is at Minute 0
min_time = df['timestamp'].min()
df = df[df['timestamp'] < min_time + (20 * 60)].copy()
df['minute'] = ((df['timestamp'] - min_time) // 5)
subs_per_min = df['minute'].value_counts().sort_index()

# 6. Generate the Graph
plt.figure(figsize=(12, 6))
plt.plot(subs_per_min.index, subs_per_min.values, color='#1f77b4', linewidth=2)
plt.fill_between(subs_per_min.index, subs_per_min.values, color='#1f77b4', alpha=0.3)

plt.title('Codeforces Contest Submissions Over Time (Contestants Only)')
plt.xlabel('Minutes since First Submission')
plt.ylabel('Submissions per Minute')
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()

# Save and show
plt.savefig('real_submissions_throughput.png')
plt.show()