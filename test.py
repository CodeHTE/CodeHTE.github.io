
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, timedelta

plt.rcParams['font.sans-serif'] = ['SimHei']   # 指定默认字体为黑体
plt.rcParams['axes.unicode_minus'] = False     # 解决负号显示为方块的问题

# 项目任务数据（任务名称、开始时间、持续天数）
tasks = [
    ("文献调研与方案设计", "2024-03-01", 60),
    ("平台开发与测试", "2024-05-01", 90),
    ("平台推广与运营", "2024-08-01", 60),
    ("成果整理与结题", "2024-10-01", 30)
]

# 转换时间格式
start_dates = [datetime.strptime(task[1], "%Y-%m-%d") for task in tasks]
durations = [task[2] for task in tasks]
task_names = [task[0] for task in tasks]

# 创建Gantt图
plt.figure(figsize=(12, 6))
plt.barh(task_names, durations, left=start_dates, height=0.6, color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'])

# 设置坐标轴
plt.xlabel("时间")
plt.ylabel("")
plt.title("大创项目进度Gantt图")
plt.grid(axis='x', linestyle='--', alpha=0.7)

# 格式化x轴日期
plt.gca().xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))
plt.gca().xaxis.set_major_locator(mdates.DayLocator(interval=15))
plt.xticks(rotation=45)

# 保存图片
plt.tight_layout()
plt.savefig("project_gantt.png", dpi=300)
plt.show()
