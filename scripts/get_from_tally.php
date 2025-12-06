<?php

$universities = json_decode(file_get_contents('../public/universities.json'), true);

function getUniversityByName(array $universities, string $name): array {
    foreach ($universities as $item) {
        if ($item['nome'] === $name) {
            return $item;
        }
    }
}

$tallyKey = getenv('TALLY_API_KEY');

$hasAnotherPage = true;
$page = 1;

$oldData = json_decode(file_get_contents('data_before_internl_survey.json'), true);
$finalData = [];
$logicaData = explode(PHP_EOL, file_get_contents('logica_data.txt'));

while ($hasAnotherPage) {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.tally.so/forms/eq5d0x/submissions?page=' . $page);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');

    $headers = array();
    $headers[] = 'Authorization: Bearer ' . $tallyKey;
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) die('Error while getting data from Tally');

    $result = json_decode($result, JSON_PRETTY_PRINT);
    $hasAnotherPage = $result['hasMore'];

    foreach ($result['submissions'] as $submission) {
        $label = 'SRV-' . strtoupper($submission['id']);

        $universityName = null;
        $username = null;

        foreach ($submission['responses'] as $response) {
            if ($response['questionId'] === '2N68QA') {
                $universityName = $response['answer'][0];
            } elseif ($response['questionId'] === 'R59KEP') {
                $chimica = $response['answer'];
            } elseif ($response['questionId'] === 'oMj6XM') {
                $fisica = $response['answer'];
            } elseif ($response['questionId'] === 'GdPv8z') {
                $biologia = $response['answer'];
            } elseif ($response['questionId'] === 'LW20oJ') {
                $username = $response['answer'];
            }
        }

        $universityObj = getUniversityByName($universities, $universityName);

        // rimuoviamo duplicati da Logica Test, ovvero studenti che hanno lo stesso voto per tutti e 3 gli esami, sia nel sondaggio di Logica, sia nel nostro
        foreach ($logicaData as $row) {
            if (stripos($row, $universityObj['id'] . '-' . number_format($fisica, 1) . '-' . number_format($chimica, 1) . '-' . number_format($biologia, 1)) === 0) {
                $etichettaLogi = explode('*', $row)[1];

                $prevSize = count($oldData);
                $oldData = array_filter($oldData, function ($q) use ($etichettaLogi) {
                    return $q['etichetta'] !== $etichettaLogi;
                });

                $oldData = array_values($oldData);
                $newSize = count($oldData);

                if ($prevSize !== $newSize) {
                    echo 'deleted ' . ($prevSize - $newSize) . ' rows (same exam grades)! ' . json_encode([$universityObj['id'], $fisica, $chimica, $biologia, $row]) . PHP_EOL;
                }
            }
        }

        /*
        if ($username && strlen($username) > 3) {
            $nickname = strtolower(preg_replace("/[^A-Za-z0-9]/", '', $username));
            $etichettaLogi = 'LOGI-' . substr(strtoupper(md5($nickname)), 0, 6);

            $prevSize = count($oldData);
            $oldData = array_filter($oldData, function ($q) use ($etichettaLogi) {
                return $q['etichetta'] !== $etichettaLogi;
            });
            $oldData = array_values($oldData);
            $newSize = count($oldData);

            if ($prevSize !== $newSize) {
                echo 'deleted ' . ($prevSize - $newSize) . ' rows! ' . $nickname . PHP_EOL;
            }
        }
        */

        if ($fisica < -0.05 || $fisica > 0.05) {
            $finalData[] = [
                'etichetta' => $label,
                'punteggio' => number_format($fisica, 2),
                'materia' => 'fisica',
                'is_from_survey' => true,
                'universita' => $universityObj
            ];
        }

        if ($chimica < -0.05 || $chimica > 0.05) {
            $finalData[] = [
                'etichetta' => $label,
                'punteggio' => number_format($chimica, 2),
                'materia' => 'chimica',
                'is_from_survey' => true,
                'universita' => $universityObj
            ];
        }

        if ($biologia < -0.05 || $biologia > 0.05) {
            $finalData[] = [
                'etichetta' => $label,
                'punteggio' => number_format($biologia, 2),
                'materia' => 'biologia',
                'is_from_survey' => true,
                'universita' => $universityObj
            ];
        }
    }

    echo 'Done page ' . $page . PHP_EOL;

    $page++;
}

if ($page < 30) die;

$finalData = array_reverse($finalData);
$finalData = array_merge($oldData, $finalData);

file_put_contents('../public/data.json', json_encode(array_values($finalData), JSON_PRETTY_PRINT));
