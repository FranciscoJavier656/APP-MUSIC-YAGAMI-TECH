import Foundation

@MainActor
class MyClass {
    let size: Int = 10
    private let context = Context()
    
    struct Context: @unchecked Sendable {}
    
    nonisolated func test() {
        print(size)
        print(context)
    }
}
