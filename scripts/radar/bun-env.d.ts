// Bun 运行时给 import.meta 挂的非标准字段 (radar 脚本只在 Bun 下跑, 见各文件 shebang)。
// 声明合并进 ImportMeta 让 Next 的 tsc 全量类型检查通过, 不引入 bun-types 整包依赖
// (radar 脚本硬约束: 零新 npm/bun deps)。
interface ImportMeta {
  /** 当前模块所在目录的绝对路径 (Bun 专有, Win + Linux 均为正确绝对目录)。 */
  readonly dir: string;
}
