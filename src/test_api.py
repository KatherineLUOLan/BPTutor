from openai import OpenAI
import time

import os

# 从环境变量读取 API 配置
api_key = os.getenv("DEEPSEEK_API_KEY")
base_url = os.getenv("DEEPSEEK_BASE_URL")

if not api_key or not base_url:
    print("❌ Error: DEEPSEEK_API_KEY and DEEPSEEK_BASE_URL environment variables must be set")
    exit(1)

# 创建客户端，设置较长的超时时间
client = OpenAI(
    api_key=api_key,
    base_url=base_url,
    timeout=120.0  # 设置120秒超时
)

print("开始测试 API...")
print("=" * 50)
start_time = time.time()

try:
    # 创建完成请求
    completion = client.chat.completions.create(
        model="deepseek-chat",  # 使用 deepseek-chat 模型
        messages=[{"role": "user", "content": "9.9和9.11谁大"}],
        max_tokens=1000
    )

    end_time = time.time()
    elapsed = end_time - start_time
    
    print(f"\n✅ 请求成功！耗时: {elapsed:.2f} 秒\n")
    
    # 获取响应
    message = completion.choices[0].message
    
    # 打印思考过程
    if hasattr(message, 'reasoning_content') and message.reasoning_content:
        print("思考过程：")
        print("-" * 50)
        print(message.reasoning_content)
        print("-" * 50)
    
    # 打印最终答案
    print("\n最终答案：")
    print("-" * 50)
    print(message.content)
    print("-" * 50)
    
    # 打印完整响应信息
    print(f"\n📊 响应统计：")
    print(f"   - 使用模型: {completion.model}")
    print(f"   - 总token数: {completion.usage.total_tokens if hasattr(completion, 'usage') else 'N/A'}")
    print(f"   - 耗时: {elapsed:.2f} 秒")
    
except Exception as e:
    print(f"\n❌ 错误: {str(e)}")
    print(f"错误类型: {type(e).__name__}")

print("\n" + "=" * 50)
