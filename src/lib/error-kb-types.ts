// error-kb.ts — AI 编码工具报错速查库(单一信息源)
//
// 定位: 面向中国大陆用户的"报错怎么修"故障排查页(雷达=发版动态,教程=怎么用,本库=出错自救)。
// 内容规范:
// - errorText 用用户真实会看到的英文报错原样(经 GitHub issue/官方文档核实),便于搜索命中;
// - fixes 每步给具体命令/操作,按"先试最简单"排序;
// - cnNote 记大陆网络环境特别处理(代理/镜像/网关),中性表述。

export interface ErrorEntry {
  /** kebab-case 唯一 slug,做路由 /errors/<slug> */
  slug: string;
  /** 涉及工具,如 "Claude Code" / "Cursor" / "通用" */
  tool: string;
  /** 页面标题(报错关键词中文化) */
  title: string;
  /** 用户实际看到的报错原文(英文原样) */
  errorText: string;
  /** 什么场景下出现 */
  symptom: string;
  /** 可能原因,按概率排序 */
  causes: string[];
  /** 修复步骤,每步具体可执行 */
  fixes: string[];
  /** 大陆网络环境特别注记,无则空串 */
  cnNote: string;
  tags: string[];
}

