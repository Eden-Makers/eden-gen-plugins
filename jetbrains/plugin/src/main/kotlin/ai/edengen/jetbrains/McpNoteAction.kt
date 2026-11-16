package ai.edengen.jetbrains

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.Messages

class McpNoteAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        Messages.showInfoMessage(
            "Add https://edengen.ai/mcp in Settings, Tools, AI Assistant, Model Context Protocol. Use mcp-remote when the IDE does not open a browser for OAuth. The README in this folder has the JSON.",
            "Eden Gen",
        )
    }
}
