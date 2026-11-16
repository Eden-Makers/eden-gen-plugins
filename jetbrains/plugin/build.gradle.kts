plugins {
    id("org.jetbrains.intellij") version "1.17.4"
}

group = "ai.edengen"
version = "0.1.0"

repositories {
    mavenCentral()
}

intellij {
    version.set("2025.1")
    type.set("IC")
    plugins.set(listOf())
}

tasks {
    patchPluginXml {
        sinceBuild.set("251")
        untilBuild.set("")
    }
}
