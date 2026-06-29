export function confirmDangerTwice({
  modal,
  title,
  firstContent,
  secondContent,
  onConfirm,
}: {
  modal: { confirm: (config: Record<string, unknown>) => void };
  title: string;
  firstContent: string;
  secondContent: string;
  onConfirm: () => void | Promise<void>;
}) {
  modal.confirm({
    title,
    content: firstContent,
    okText: '继续删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      modal.confirm({
        title: '再次确认删除',
        content: secondContent,
        okText: '我确认永久删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: onConfirm,
      });
    },
  });
}
