//
//  ContentView.swift
//  OwasNlpIntegration
//
//  Created by Mathieu Monney on 26/07/2022.
//

import SwiftUI
import OwasNlp

struct ContentView: View {
    @State private var inputText = ""
    @State private var hateSpeechResultText = "Result 1"
    @State private var toxicityResultText = "Result 1"
    @State private var profanityResultText = "Result 1"
    @State private var sensitiveInfoResultText = "Result 1"
    
    var body: some View {
        VStack(alignment: .leading) {
            TextField("Enter text", text: $inputText)
                .frame(height: 200)
                .textFieldStyle(PlainTextFieldStyle())
                .padding([.horizontal], 8)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.gray))
                .padding(.bottom, 20)
            
            HStack {
                Button("Clear", action: {
                    self.inputText = ""
                })
                
                Spacer()
                
                Button("Analyse", action: {
                    let hateSpeechResult = HateSpeechAnalyzer.sharedInstance().analyze(text: self.inputText)
                    hateSpeechResultText = String(format: "Hate speech result: %.2f", hateSpeechResult)
                    
                    let toxicityResult = ToxicityAnalyzer.sharedInstance().analyze(text: self.inputText)
                    toxicityResultText = String(format: "Toxicity result: %.2f", toxicityResult)
                    
                    let profanityResult = ProfanityAnalyzer.sharedInstance().containsProfanity(text: self.inputText)
                    profanityResultText = "Contains profanity: \(profanityResult)"
                    
                    let sensitiveInfos = SensitiveInfoAnalyzer.sharedInstance().analyse(text: self.inputText)
                    sensitiveInfoResultText = "Sensitive informations: \((sensitiveInfos?.asArray() ?? [SensitiveInfoMatch]()).map { $0.rawValue }.joined(separator: ", "))"
                })
            }
            .padding(.bottom, 20)
            
            Text(hateSpeechResultText)
            Text(toxicityResultText)
            Text(profanityResultText)
            Text(sensitiveInfoResultText)
            
        }
        .offset(x: 0, y: -50)
        .padding([.leading, .trailing], 24)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
